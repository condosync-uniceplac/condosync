import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ withTransaction: (fn) => fn('tx'), query: vi.fn() }));
vi.mock('@/repositories/chamadosRepository', () => ({
  listByCondominio: vi.fn(),
  listCategorias: vi.fn(),
  categoriaExiste: vi.fn(),
  contarAbertos: vi.fn(),
  findById: vi.fn(),
  lockStatus: vi.fn(),
  create: vi.fn(),
  updateStatus: vi.fn(),
  tocar: vi.fn(),
  addAcompanhamento: vi.fn(),
  listAcompanhamentos: vi.fn(),
  addAnexo: vi.fn(),
  findAnexo: vi.fn(),
}));

const repo = await import('@/repositories/chamadosRepository');
const svc = await import('@/services/chamadosService');
const { statusChamadoSchema, chamadoSchema } = await import('@/lib/validators');

const morador = { sub: '1', perfil: 'MORADOR', condominioId: '1', vinculoId: '10', unidadeId: '4' };
const outroMorador = { ...morador, sub: '2', vinculoId: '20' };
const portaria = { sub: '5', perfil: 'PORTARIA', condominioId: '1', vinculoId: '50' };
const sindico = { sub: '3', perfil: 'SINDICO', condominioId: '1', vinculoId: '30', unidadeId: '9' };
const admin = { sub: '9', perfil: 'ADMIN', condominioId: '1', vinculoId: '90' };
const dados = {
  titulo: 'Lâmpada queimada',
  descricao: 'Garagem do bloco A escura.',
  categoriaId: 3,
  urgencia: 'ALTA',
};
const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(50)]);

const comStatus = (status) =>
  repo.lockStatus.mockResolvedValue({ id: 7, status, solicitante_id: '10' });

describe('tabela de transições (RN.22 / bug #18)', () => {
  it.each([
    // perfil, status atual, permitidos
    ['MORADOR', 'ABERTO', []],
    ['MORADOR', 'EM_ANALISE', []],
    ['MORADOR', 'RESOLVIDO', []],
    ['PORTARIA', 'ABERTO', ['EM_ANALISE']],
    ['PORTARIA', 'EM_ANALISE', []],
    ['PORTARIA', 'RESOLVIDO', []],
    ['SINDICO', 'ABERTO', ['EM_ANALISE', 'RESOLVIDO']],
    ['SINDICO', 'EM_ANALISE', ['ABERTO', 'RESOLVIDO']],
    ['SINDICO', 'RESOLVIDO', ['ABERTO', 'EM_ANALISE']],
    ['ADMIN', 'EM_ANALISE', ['ABERTO', 'RESOLVIDO']],
  ])('%s em %s pode ir para %j', (perfil, atual, esperado) => {
    expect(svc.transicoesPermitidas(perfil, atual)).toEqual(esperado);
  });

  it('só portaria, síndico e admin comentam', () => {
    expect(svc.podeComentar('MORADOR')).toBe(false);
    expect(['PORTARIA', 'SINDICO', 'ADMIN'].every(svc.podeComentar)).toBe(true);
  });
});

describe('chamadosService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.categoriaExiste.mockResolvedValue(true);
    repo.create.mockResolvedValue({ id: 7 });
    repo.listByCondominio.mockResolvedValue([]);
    repo.listCategorias.mockResolvedValue([]);
    repo.findById.mockResolvedValue({ id: 7, status: 'ABERTO', solicitante_id: '10' });
  });

  it('morador lista só os próprios; portaria e síndico veem todos', async () => {
    await svc.listar(morador);
    expect(repo.listByCondominio).toHaveBeenLastCalledWith('1', { solicitanteId: '10' });
    await svc.listar(portaria);
    expect(repo.listByCondominio).toHaveBeenLastCalledWith('1', {});
    await svc.listar(sindico);
    expect(repo.listByCondominio).toHaveBeenLastCalledWith('1', {});
  });

  it('morador não abre o chamado de outro morador', async () => {
    await expect(svc.detalhar(outroMorador, 7)).rejects.toMatchObject({ status: 404 });
    repo.listAcompanhamentos.mockResolvedValue([]);
    await expect(svc.detalhar(morador, 7)).resolves.toMatchObject({
      chamado: { id: 7, meu: true },
    });
  });

  it('abre chamado com a unidade do solicitante e a foto', async () => {
    const r = await svc.abrir(morador, dados, { nome: 'foto.jpg', conteudo: jpg });
    expect(r).toEqual({ id: 7 });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ solicitanteId: '10', unidadeId: '4', condominioId: '1' }),
      'tx',
    );
    expect(repo.addAnexo).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ mime: 'image/jpeg' }),
      'tx',
    );
  });

  it('portaria (sem unidade) também abre chamado', async () => {
    await svc.abrir(portaria, dados);
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ unidadeId: null }), 'tx');
    expect(repo.addAnexo).not.toHaveBeenCalled();
  });

  it('recusa categoria inexistente e foto inválida', async () => {
    repo.categoriaExiste.mockResolvedValueOnce(false);
    await expect(svc.abrir(morador, dados)).rejects.toMatchObject({ status: 422 });
    await expect(
      svc.abrir(morador, dados, { nome: 'foto.jpg', conteudo: Buffer.from('MZ') }),
    ).rejects.toMatchObject({ status: 422, details: { anexo: expect.any(String) } });
  });

  it('morador não altera status nem do próprio chamado', async () => {
    comStatus('ABERTO');
    await expect(svc.alterarStatus(morador, 7, { status: 'EM_ANALISE' })).rejects.toMatchObject({
      status: 403,
    });
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it('portaria move de Aberto para Em análise e o histórico registra', async () => {
    comStatus('ABERTO');
    await svc.alterarStatus(portaria, 7, { status: 'EM_ANALISE', comentario: 'Zelador avisado' });
    expect(repo.updateStatus).toHaveBeenCalledWith(7, 'EM_ANALISE', 'tx');
    expect(repo.addAcompanhamento).toHaveBeenCalledWith(
      7,
      { autorId: '50', novoStatus: 'EM_ANALISE', comentario: 'Zelador avisado' },
      'tx',
    );
  });

  it('portaria não resolve nem reabre', async () => {
    comStatus('EM_ANALISE');
    await expect(svc.alterarStatus(portaria, 7, { status: 'RESOLVIDO' })).rejects.toMatchObject({
      status: 403,
      message: expect.stringMatching(/síndico/),
    });
    comStatus('RESOLVIDO');
    await expect(svc.alterarStatus(portaria, 7, { status: 'ABERTO' })).rejects.toMatchObject({
      status: 403,
    });
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it('síndico resolve e reabre; admin também', async () => {
    comStatus('EM_ANALISE');
    await svc.alterarStatus(sindico, 7, { status: 'RESOLVIDO' });
    expect(repo.updateStatus).toHaveBeenLastCalledWith(7, 'RESOLVIDO', 'tx');
    comStatus('RESOLVIDO');
    await svc.alterarStatus(admin, 7, { status: 'ABERTO' });
    expect(repo.updateStatus).toHaveBeenLastCalledWith(7, 'ABERTO', 'tx');
    expect(repo.addAcompanhamento).toHaveBeenLastCalledWith(
      7,
      { autorId: '90', novoStatus: 'ABERTO', comentario: null },
      'tx',
    );
  });

  it('recusa mover para o status em que já está', async () => {
    comStatus('ABERTO');
    await expect(svc.alterarStatus(sindico, 7, { status: 'ABERTO' })).rejects.toMatchObject({
      status: 409,
    });
  });

  it('chamado de outro condomínio não é encontrado', async () => {
    repo.lockStatus.mockResolvedValue(null);
    await expect(svc.alterarStatus(sindico, 99, { status: 'RESOLVIDO' })).rejects.toMatchObject({
      status: 404,
    });
  });

  it('comentário: morador recusado; portaria registra', async () => {
    await expect(svc.comentar(morador, 7, { comentario: 'Oi' })).rejects.toMatchObject({
      status: 403,
    });
    await svc.comentar(portaria, 7, { comentario: 'Equipe a caminho' });
    expect(repo.addAcompanhamento).toHaveBeenCalledWith(
      7,
      { autorId: '50', comentario: 'Equipe a caminho' },
      'tx',
    );
    expect(repo.tocar).toHaveBeenCalledWith(7, 'tx');
  });

  it('foto: morador só baixa a dos próprios chamados', async () => {
    repo.findAnexo.mockResolvedValue({ conteudo: jpg, solicitante_id: '10' });
    await expect(svc.baixarAnexo(outroMorador, 7, 1)).rejects.toMatchObject({ status: 404 });
    await expect(svc.baixarAnexo(morador, 7, 1)).resolves.toMatchObject({ conteudo: jpg });
    await expect(svc.baixarAnexo(portaria, 7, 1)).resolves.toBeTruthy();
  });

  it('resumo conta só os próprios para o morador', async () => {
    repo.contarAbertos.mockResolvedValue(2);
    expect(await svc.resumo(morador)).toEqual({ abertos: 2 });
    expect(repo.contarAbertos).toHaveBeenCalledWith('1', { solicitanteId: '10' });
  });
});

describe('validação do chamado', () => {
  it('exige título, descrição e urgência válidos', () => {
    expect(chamadoSchema.safeParse({ ...dados, categoriaId: '3' }).success).toBe(true);
    expect(chamadoSchema.safeParse({ ...dados, urgencia: 'URGENTE' }).success).toBe(false);
    expect(chamadoSchema.safeParse({ ...dados, descricao: 'curto' }).success).toBe(false);
  });

  it('comentário da troca de status é opcional', () => {
    expect(statusChamadoSchema.parse({ status: 'RESOLVIDO', comentario: '' })).toEqual({
      status: 'RESOLVIDO',
      comentario: undefined,
    });
    expect(statusChamadoSchema.safeParse({ status: 'FECHADO' }).success).toBe(false);
  });
});
