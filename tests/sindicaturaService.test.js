import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ withTransaction: (fn) => fn('tx'), query: vi.fn() }));
vi.mock('@/repositories/vinculosRepository', () => ({
  findSindicoAtivo: vi.fn(),
  listMoradoresAtivos: vi.fn(),
  findMoradorAtivo: vi.fn(),
  alterarPapel: vi.fn(),
}));

const repo = await import('@/repositories/vinculosRepository');
const { consultar, designar, retirar } = await import('@/services/sindicaturaService');

const admin = { perfil: 'ADMIN', condominioId: '1', vinculoId: '50' };
const sindico = { perfil: 'SINDICO', condominioId: '1', vinculoId: '30' };
const morador = { perfil: 'MORADOR', condominioId: '1', vinculoId: '10' };

describe('sindicaturaService — designação do síndico', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findMoradorAtivo.mockResolvedValue({ id: 10, usuario_id: 1, nome_completo: 'Maria' });
    repo.findSindicoAtivo.mockResolvedValue({ id: 30, usuario_id: 3, unidade_id: 7 });
  });

  it('administrador designa: o atual volta a ser morador e o eleito vira síndico', async () => {
    const r = await designar(admin, 10);
    expect(repo.alterarPapel).toHaveBeenNthCalledWith(
      1,
      30,
      { perfil: 'MORADOR', ativo: true },
      'tx',
    );
    expect(repo.alterarPapel).toHaveBeenNthCalledWith(
      2,
      10,
      { perfil: 'SINDICO', ativo: true },
      'tx',
    );
    expect(r).toEqual({ sindico: 'Maria', voceSaiu: false });
  });

  it('síndico sem unidade perde o acesso ao deixar a função', async () => {
    repo.findSindicoAtivo.mockResolvedValue({ id: 30, usuario_id: 3, unidade_id: null });
    await designar(admin, 10);
    expect(repo.alterarPapel).toHaveBeenNthCalledWith(
      1,
      30,
      { perfil: 'SINDICO', ativo: false },
      'tx',
    );
  });

  it('síndico atual transfere a função e sai da sessão', async () => {
    const r = await designar(sindico, 10);
    expect(r.voceSaiu).toBe(true);
  });

  it('condomínio sem síndico: o administrador só promove o eleito', async () => {
    repo.findSindicoAtivo.mockResolvedValue(null);
    await designar(admin, 10);
    expect(repo.alterarPapel).toHaveBeenCalledTimes(1);
  });

  it('morador não designa síndico', async () => {
    await expect(designar(morador, 10)).rejects.toMatchObject({ status: 403 });
    await expect(consultar(morador)).rejects.toMatchObject({ status: 403 });
    expect(repo.alterarPapel).not.toHaveBeenCalled();
  });

  it('só morador ativo do mesmo condomínio pode ser designado', async () => {
    repo.findMoradorAtivo.mockResolvedValue(null);
    await expect(designar(admin, 99)).rejects.toMatchObject({ status: 404 });
  });

  it('não designa quem já é o síndico', async () => {
    repo.findSindicoAtivo.mockResolvedValue({ id: 30, usuario_id: 1, unidade_id: 7 });
    await expect(designar(admin, 10)).rejects.toMatchObject({ status: 422 });
  });
});

describe('sindicaturaService — retirar a função', () => {
  beforeEach(() => vi.clearAllMocks());

  it('administrador retira: o síndico volta a ser morador da unidade', async () => {
    repo.findSindicoAtivo.mockResolvedValue({ id: 30, unidade_id: 7, nome_completo: 'Maria' });
    const r = await retirar(admin);
    expect(repo.alterarPapel).toHaveBeenCalledWith(30, { perfil: 'MORADOR', ativo: true }, 'tx');
    expect(r).toEqual({ exSindico: 'Maria', voltouAMorador: true });
  });

  it('só o administrador retira, e só se houver síndico', async () => {
    await expect(retirar(sindico)).rejects.toMatchObject({ status: 403 });
    repo.findSindicoAtivo.mockResolvedValue(null);
    await expect(retirar(admin)).rejects.toMatchObject({ status: 404 });
  });
});
