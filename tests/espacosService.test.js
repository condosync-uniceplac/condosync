/**
 * Testes automatizados (Vitest) de espaços comuns (espacosService) e validação do formulário.
 * Rodam com `npm test` e em todo Pull Request (GitHub Actions).
 * describe agrupa os casos; cada it(...) é um caso de teste; expect(...) confere o resultado.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock troca o banco/repositórios por funções falsas: o teste confere só a regra de negócio,
// sem precisar de um banco de verdade.
vi.mock('@/repositories/espacosRepository', () => ({
  listTodos: vi.fn(),
  findById: vi.fn(),
  existeNome: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  removeSemReservas: vi.fn(),
}));

const repo = await import('@/repositories/espacosRepository');
const { criar, editar, excluir, listar } = await import('@/services/espacosService');
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
  // Antes de cada teste: zera as funções falsas e define as respostas padrão.
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

describe('excluir espaço (#62)', () => {
  it('exclui espaço sem nenhuma reserva', async () => {
    repo.findById.mockResolvedValue({ id: 4, nome: 'Piscina' });
    repo.removeSemReservas.mockResolvedValue(true);
    await expect(excluir(sindico, 4)).resolves.toBeUndefined();
    expect(repo.removeSemReservas).toHaveBeenCalledWith(4, '1');
  });

  it('espaço com histórico de reservas não é excluído (409, orienta desativar)', async () => {
    repo.findById.mockResolvedValue({ id: 4, nome: 'Piscina' });
    repo.removeSemReservas.mockResolvedValue(false);
    await expect(excluir(sindico, 4)).rejects.toMatchObject({
      status: 409,
      message: expect.stringMatching(/Desative/),
    });
  });

  it('morador não exclui; espaço de outro condomínio dá 404', async () => {
    await expect(excluir(morador, 4)).rejects.toMatchObject({ status: 403 });
    repo.findById.mockResolvedValue(null);
    await expect(excluir(sindico, 99)).rejects.toMatchObject({ status: 404 });
  });

  it('a lista informa se o espaço pode ser excluído', async () => {
    repo.listTodos.mockResolvedValue([
      { id: 1, nome: 'A', tem_reservas: true },
      { id: 2, nome: 'B', tem_reservas: false },
    ]);
    const lista = await listar(sindico);
    expect(lista.map((e) => e.podeExcluir)).toEqual([false, true]);
  });
});
