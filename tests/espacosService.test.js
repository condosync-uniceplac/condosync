import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/repositories/espacosRepository', () => ({
  listTodos: vi.fn(),
  findById: vi.fn(),
  existeNome: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

const repo = await import('@/repositories/espacosRepository');
const { criar, editar, listar } = await import('@/services/espacosService');
const { espacoSchema } = await import('@/lib/validators');

const sindico = { perfil: 'SINDICO', condominioId: '1' };
const morador = { perfil: 'MORADOR', condominioId: '1' };
const dados = { nome: 'Piscina', capacidade: 40, valor: 0, ativo: true };

describe('validação do espaço', () => {
  it('aceita valor com vírgula convertido e isento', () => {
    expect(
      espacoSchema.safeParse({ nome: 'Piscina', capacidade: '40', valor: '12.50' }).success,
    ).toBe(true);
    expect(
      espacoSchema.safeParse({ nome: 'Piscina', capacidade: '40', valor: '0' }).data.ativo,
    ).toBe(true);
  });

  it('recusa capacidade zero, valor negativo e mais de 2 casas', () => {
    expect(espacoSchema.safeParse({ ...dados, capacidade: 0 }).success).toBe(false);
    expect(espacoSchema.safeParse({ ...dados, valor: -1 }).success).toBe(false);
    expect(espacoSchema.safeParse({ ...dados, valor: 10.555 }).success).toBe(false);
  });
});

describe('espacosService (RF.09)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.existeNome.mockResolvedValue(false);
    repo.create.mockResolvedValue({ id: 9 });
  });

  it('síndico cadastra espaço', async () => {
    expect(await criar(sindico, dados)).toEqual({ id: 9 });
    expect(repo.create).toHaveBeenCalledWith('1', dados);
  });

  it('não permite nome repetido no condomínio', async () => {
    repo.existeNome.mockResolvedValue(true);
    await expect(criar(sindico, dados)).rejects.toMatchObject({ status: 409 });
  });

  it('edita e desativa espaço do próprio condomínio, ignorando o próprio nome', async () => {
    repo.findById.mockResolvedValue({ id: 3, nome: 'Piscina' });
    await editar(sindico, 3, { ...dados, ativo: false });
    expect(repo.existeNome).toHaveBeenCalledWith('1', 'Piscina', 3);
    expect(repo.update).toHaveBeenCalledWith(3, { ...dados, ativo: false });
  });

  it('espaço de outro condomínio não é encontrado', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(editar(sindico, 99, dados)).rejects.toMatchObject({ status: 404 });
  });

  it('morador não gerencia espaços', async () => {
    await expect(listar(morador)).rejects.toMatchObject({ status: 403 });
    await expect(criar(morador, dados)).rejects.toMatchObject({ status: 403 });
  });
});
