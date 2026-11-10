/**
 * Testes automatizados (Vitest) de mural de avisos (avisosService) e validação de anexos.
 * Rodam com `npm test` e em todo Pull Request (GitHub Actions).
 * describe agrupa os casos; cada it(...) é um caso de teste; expect(...) confere o resultado.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock troca o banco/repositórios por funções falsas: o teste confere só a regra de negócio,
// sem precisar de um banco de verdade.
vi.mock('@/lib/db', () => ({ withTransaction: (fn) => fn('tx'), query: vi.fn() }));
vi.mock('@/repositories/avisosRepository', () => ({
  listByCondominio: vi.fn(),
  listCategorias: vi.fn(),
  categoriaExiste: vi.fn(),
  contarNaoLidos: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  addAnexo: vi.fn(),
  removeAnexos: vi.fn(),
  findAnexo: vi.fn(),
  marcarLido: vi.fn(),
}));

const repo = await import('@/repositories/avisosRepository');
const svc = await import('@/services/avisosService');
const { validarAnexo, nomeSeguro } = await import('@/lib/anexos');

const sindico = { sub: '3', perfil: 'SINDICO', condominioId: '1', vinculoId: '30' };
const morador = { sub: '1', perfil: 'MORADOR', condominioId: '1', vinculoId: '10' };
const dados = {
  titulo: 'Manutenção do elevador',
  corpo: 'O elevador do bloco A para amanhã.',
  categoriaId: 5,
  prioridade: 'URGENTE',
};
const pdf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(100)]);

describe('anexos do mural', () => {
  it('aceita PDF, PNG e JPG pelo conteúdo', () => {
    expect(validarAnexo('ata.pdf', pdf)).toEqual({ mime: 'application/pdf' });
    expect(validarAnexo('foto.JPG', Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toEqual({
      mime: 'image/jpeg',
    });
  });

  it('recusa extensão não permitida, conteúdo falso e arquivo grande', () => {
    expect(validarAnexo('virus.exe', pdf).erro).toBeDefined();
    expect(validarAnexo('falso.pdf', Buffer.from('MZ executável')).erro).toMatch(/não corresponde/);
    expect(
      validarAnexo('grande.pdf', Buffer.concat([pdf, Buffer.alloc(2 * 1024 * 1024)])).erro,
    ).toMatch(/2 MB/);
  });

  it('limpa o nome do arquivo para o download', () => {
    expect(nomeSeguro('../../etc/"passwd".pdf')).toBe('.._.._etc_passwd.pdf');
  });
});

describe('avisosService (RN.20)', () => {
  // Antes de cada teste: zera as funções falsas e define as respostas padrão.
  beforeEach(() => {
    vi.clearAllMocks();
    repo.categoriaExiste.mockResolvedValue(true);
    repo.create.mockResolvedValue({ id: 7 });
    repo.findById.mockResolvedValue({ id: 7 });
  });

  it('síndico publica com anexo e já conta como leitor', async () => {
    const r = await svc.publicar(sindico, dados, { nome: 'aviso.pdf', conteudo: pdf });
    expect(r).toEqual({ id: 7 });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ autorId: '30', condominioId: '1', prioridade: 'URGENTE' }),
      'tx',
    );
    expect(repo.addAnexo).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ mime: 'application/pdf' }),
      'tx',
    );
    expect(repo.marcarLido).toHaveBeenCalledWith(7, '3', 'tx');
  });

  it('morador e portaria não publicam, editam nem removem', async () => {
    await expect(svc.publicar(morador, dados)).rejects.toMatchObject({ status: 403 });
    await expect(svc.editar({ ...morador, perfil: 'PORTARIA' }, 7, dados)).rejects.toMatchObject({
      status: 403,
    });
    await expect(svc.remover(morador, 7)).rejects.toMatchObject({ status: 403 });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('anexo inválido não publica o aviso', async () => {
    await expect(
      svc.publicar(sindico, dados, { nome: 'x.pdf', conteudo: Buffer.from('nada') }),
    ).rejects.toMatchObject({
      status: 422,
    });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('categoria inexistente é recusada', async () => {
    repo.categoriaExiste.mockResolvedValue(false);
    await expect(svc.publicar(sindico, dados)).rejects.toMatchObject({ status: 422 });
  });

  it('editar com remoção do anexo', async () => {
    await svc.editar(sindico, 7, dados, null, { removerAnexo: true });
    expect(repo.update).toHaveBeenCalledWith(7, dados, 'tx');
    expect(repo.removeAnexos).toHaveBeenCalledWith(7, 'tx');
    expect(repo.addAnexo).not.toHaveBeenCalled();
  });

  it('qualquer usuário do condomínio confirma leitura; de outro condomínio, 404', async () => {
    await svc.confirmarLeitura(morador, 7);
    expect(repo.marcarLido).toHaveBeenCalledWith(7, '1');
    repo.findById.mockResolvedValue(null);
    await expect(svc.confirmarLeitura(morador, 99)).rejects.toMatchObject({ status: 404 });
  });

  it('anexo só é baixado se for do condomínio do usuário (bug #19)', async () => {
    repo.findAnexo.mockResolvedValue(null);
    await expect(svc.baixarAnexo(morador, 7, 1)).rejects.toMatchObject({ status: 404 });
    expect(repo.findAnexo).toHaveBeenCalledWith(7, 1, '1');
  });
});
