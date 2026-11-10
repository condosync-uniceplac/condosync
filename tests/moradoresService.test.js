import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ withTransaction: (fn) => fn('tx'), query: vi.fn() }));
vi.mock('@/lib/password', () => ({ hashPassword: vi.fn(async () => 'hash') }));
vi.mock('@/services/authService', () => ({
  enviarConvite: vi.fn(async () => ({ enviado: true, link: 'http://x/redefinir-senha?token=t' })),
}));
vi.mock('@/repositories/condominiosRepository', () => ({
  listUnidades: vi.fn(),
  findUnidade: vi.fn(),
}));
vi.mock('@/repositories/usuariosRepository', () => ({ create: vi.fn() }));
vi.mock('@/repositories/vinculosRepository', () => ({
  listResidentes: vi.fn(),
  findAtivo: vi.fn(),
  definirUnidade: vi.fn(),
  encerrar: vi.fn(),
  listPortaria: vi.fn(),
  create: vi.fn(),
}));

const vinculos = await import('@/repositories/vinculosRepository');
const condominios = await import('@/repositories/condominiosRepository');
const usuarios = await import('@/repositories/usuariosRepository');
const auth = await import('@/services/authService');
const svc = await import('@/services/moradoresService');

const sindico = { perfil: 'SINDICO', condominioId: '1', vinculoId: '30' };
const morador = { perfil: 'MORADOR', condominioId: '1', vinculoId: '10' };

describe('moradoresService — moradores por unidade', () => {
  beforeEach(() => vi.clearAllMocks());

  it('agrupa os moradores por unidade', async () => {
    condominios.listUnidades.mockResolvedValue([
      { id: 1, numero: '101', bloco: 'A' },
      { id: 2, numero: '102', bloco: 'A' },
    ]);
    vinculos.listResidentes.mockResolvedValue([
      { id: 10, perfil: 'MORADOR', unidade_id: 1, nome_completo: 'Maria' },
      { id: 11, perfil: 'SINDICO', unidade_id: 1, nome_completo: 'João' },
    ]);
    const r = await svc.listarUnidades(sindico);
    expect(r[0].moradores).toHaveLength(2);
    expect(r[0].moradores[1].sindico).toBe(true);
    expect(r[1].moradores).toHaveLength(0);
  });

  it('troca o morador de unidade do mesmo condomínio', async () => {
    vinculos.findAtivo.mockResolvedValue({ id: 10, unidade_id: 1, perfil: 'MORADOR' });
    condominios.findUnidade.mockResolvedValue({ id: 2, condominio_id: 1 });
    await svc.moverDeUnidade(sindico, 10, 2);
    expect(vinculos.definirUnidade).toHaveBeenCalledWith(10, 2);
  });

  it('não move para unidade de outro condomínio', async () => {
    vinculos.findAtivo.mockResolvedValue({ id: 10, unidade_id: 1, perfil: 'MORADOR' });
    condominios.findUnidade.mockResolvedValue({ id: 9, condominio_id: 2 });
    await expect(svc.moverDeUnidade(sindico, 10, 9)).rejects.toMatchObject({ status: 422 });
    expect(vinculos.definirUnidade).not.toHaveBeenCalled();
  });

  it('remove o morador, mas não o síndico', async () => {
    vinculos.findAtivo.mockResolvedValue({ id: 10, perfil: 'MORADOR' });
    await svc.removerMorador(sindico, 10);
    expect(vinculos.encerrar).toHaveBeenCalledWith(10);
    vinculos.findAtivo.mockResolvedValue({ id: 30, perfil: 'SINDICO' });
    await expect(svc.removerMorador(sindico, 30)).rejects.toMatchObject({ status: 409 });
  });

  it('morador não gerencia outros moradores', async () => {
    await expect(svc.listarUnidades(morador)).rejects.toMatchObject({ status: 403 });
    await expect(svc.removerMorador(morador, 11)).rejects.toMatchObject({ status: 403 });
  });
});

describe('moradoresService — contas da portaria', () => {
  beforeEach(() => vi.clearAllMocks());
  const dados = {
    nome: 'Paulo Porteiro',
    email: 'paulo@exemplo.com',
    telefone: '61999990000',
    cpf: '52998224725',
    dataNascimento: '1990-01-01',
  };

  it('cria a conta ativa da portaria e envia o convite', async () => {
    usuarios.create.mockResolvedValue({
      id: 7,
      nome_completo: 'Paulo Porteiro',
      email: 'paulo@exemplo.com',
    });
    const r = await svc.criarPortaria(sindico, dados);
    expect(vinculos.create).toHaveBeenCalledWith(
      { usuarioId: 7, condominioId: '1', perfil: 'PORTARIA', ativo: true },
      'tx',
    );
    expect(auth.enviarConvite).toHaveBeenCalled();
    expect(r).toMatchObject({
      email: 'paulo@exemplo.com',
      conviteEnviado: true,
      linkConvite: null,
    });
  });

  it('e-mail ou CPF repetido vira 409', async () => {
    usuarios.create.mockRejectedValue(Object.assign(new Error('dup'), { code: '23505' }));
    await expect(svc.criarPortaria(sindico, dados)).rejects.toMatchObject({ status: 409 });
    expect(auth.enviarConvite).not.toHaveBeenCalled();
  });

  it('desativa só conta da portaria do próprio condomínio', async () => {
    vinculos.findAtivo.mockResolvedValue(null);
    await expect(svc.desativarPortaria(sindico, 99)).rejects.toMatchObject({ status: 404 });
    expect(vinculos.findAtivo).toHaveBeenCalledWith(99, '1', ['PORTARIA']);
  });
});
