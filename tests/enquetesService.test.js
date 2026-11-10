/**
 * Testes automatizados (Vitest) de enquetes (enquetesService): criação, prazos e voto por unidade (RN.24).
 * Rodam com `npm test` e em todo Pull Request (GitHub Actions).
 * describe agrupa os casos; cada it(...) é um caso de teste; expect(...) confere o resultado.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock troca o banco/repositórios por funções falsas: o teste confere só a regra de negócio,
// sem precisar de um banco de verdade.
vi.mock('@/lib/db', () => ({ withTransaction: (fn) => fn('tx'), query: vi.fn() }));
vi.mock('@/repositories/enquetesRepository', () => ({
  listByCondominio: vi.fn(),
  create: vi.fn(),
  addOpcoes: vi.fn(),
  lockAberta: vi.fn(),
  opcaoDaEnquete: vi.fn(),
  votar: vi.fn(),
  encerrar: vi.fn(),
  exists: vi.fn(),
  contarAbertas: vi.fn(),
}));

const repo = await import('@/repositories/enquetesRepository');
const svc = await import('@/services/enquetesService');
const { enqueteSchema, votoSchema } = await import('@/lib/validators');

const morador = { sub: '1', perfil: 'MORADOR', condominioId: '1', vinculoId: '10', unidadeId: '4' };
const conjuge = { ...morador, sub: '2', vinculoId: '20' };
const sindico = { sub: '3', perfil: 'SINDICO', condominioId: '1', vinculoId: '30', unidadeId: '9' };
const sindicoSemUnidade = { ...sindico, unidadeId: null };
const portaria = { sub: '5', perfil: 'PORTARIA', condominioId: '1', vinculoId: '50' };
const admin = { sub: '9', perfil: 'ADMIN', condominioId: '1', vinculoId: '90' };
const agora = new Date('2026-11-10T12:00:00-03:00');
const dados = { pergunta: 'Pintar a fachada?', encerraEm: '2026-11-20', opcoes: ['Sim', 'Não'] };

describe('enquetesService (RN.24)', () => {
  // Antes de cada teste: zera as funções falsas e define as respostas padrão.
  beforeEach(() => {
    vi.clearAllMocks();
    repo.create.mockResolvedValue({ id: 5 });
    repo.lockAberta.mockResolvedValue({ id: 5, encerrada: false });
    repo.opcaoDaEnquete.mockResolvedValue(true);
    repo.listByCondominio.mockResolvedValue([]);
  });

  it('síndico cria a enquete com fim no último minuto do dia escolhido', async () => {
    expect(await svc.criar(sindico, dados, agora)).toEqual({ id: 5 });
    const { encerraEm } = repo.create.mock.calls[0][0];
    expect(encerraEm.toISOString()).toBe('2026-11-21T02:59:59.000Z');
    expect(repo.addOpcoes).toHaveBeenCalledWith(5, ['Sim', 'Não'], 'tx');
  });

  it('admin também cria; morador e portaria não', async () => {
    await expect(svc.criar(admin, dados, agora)).resolves.toEqual({ id: 5 });
    await expect(svc.criar(morador, dados, agora)).rejects.toMatchObject({ status: 403 });
    await expect(svc.criar(portaria, dados, agora)).rejects.toMatchObject({ status: 403 });
  });

  it('recusa data no passado e prazo maior que 90 dias; hoje é aceito', async () => {
    await expect(
      svc.criar(sindico, { ...dados, encerraEm: '2026-11-09' }, agora),
    ).rejects.toMatchObject({
      status: 422,
      details: { encerraEm: expect.stringMatching(/passado/) },
    });
    await expect(
      svc.criar(sindico, { ...dados, encerraEm: '2027-03-01' }, agora),
    ).rejects.toMatchObject({
      status: 422,
      details: { encerraEm: expect.stringMatching(/90 dias/) },
    });
    await expect(
      svc.criar(sindico, { ...dados, encerraEm: '2026-11-10' }, agora),
    ).resolves.toBeTruthy();
    await expect(
      svc.criar(sindico, { ...dados, encerraEm: '2026-02-31' }, agora),
    ).rejects.toMatchObject({ status: 422 });
  });

  it('voto é gravado pela unidade de quem vota', async () => {
    await svc.votar(morador, 5, { opcaoId: 11 });
    expect(repo.votar).toHaveBeenCalledWith(
      { enqueteId: 5, unidadeId: '4', usuarioId: '1', opcaoId: 11 },
      'tx',
    );
  });

  it('outra pessoa da mesma unidade troca o voto da unidade (não soma)', async () => {
    await svc.votar(morador, 5, { opcaoId: 11 });
    await svc.votar(conjuge, 5, { opcaoId: 12 });
    expect(repo.votar.mock.calls.map((c) => c[0].unidadeId)).toEqual(['4', '4']);
    expect(repo.votar).toHaveBeenLastCalledWith(
      expect.objectContaining({ usuarioId: '2', opcaoId: 12 }),
      'tx',
    );
  });

  it('síndico com unidade vota; portaria, admin e síndico sem unidade não', async () => {
    await expect(svc.votar(sindico, 5, { opcaoId: 11 })).resolves.toBeUndefined();
    for (const s of [portaria, admin, sindicoSemUnidade]) {
      await expect(svc.votar(s, 5, { opcaoId: 11 })).rejects.toMatchObject({ status: 403 });
    }
  });

  it('não vota em enquete encerrada, inexistente ou com opção de outra enquete', async () => {
    repo.lockAberta.mockResolvedValueOnce({ id: 5, encerrada: true });
    await expect(svc.votar(morador, 5, { opcaoId: 11 })).rejects.toMatchObject({ status: 409 });
    repo.lockAberta.mockResolvedValueOnce(null);
    await expect(svc.votar(morador, 99, { opcaoId: 11 })).rejects.toMatchObject({ status: 404 });
    repo.opcaoDaEnquete.mockResolvedValueOnce(false);
    await expect(svc.votar(morador, 5, { opcaoId: 77 })).rejects.toMatchObject({ status: 422 });
    expect(repo.votar).not.toHaveBeenCalled();
  });

  it('só o síndico encerra; encerrar duas vezes dá 409', async () => {
    await expect(svc.encerrar(morador, 5)).rejects.toMatchObject({ status: 403 });
    repo.encerrar.mockResolvedValueOnce(true);
    await expect(svc.encerrar(sindico, 5)).resolves.toBeUndefined();
    expect(repo.encerrar).toHaveBeenCalledWith(5, '1', '30');
    repo.encerrar.mockResolvedValueOnce(false);
    repo.exists.mockResolvedValueOnce(true);
    await expect(svc.encerrar(sindico, 5)).rejects.toMatchObject({ status: 409 });
    repo.encerrar.mockResolvedValueOnce(false);
    repo.exists.mockResolvedValueOnce(false);
    await expect(svc.encerrar(sindico, 6)).rejects.toMatchObject({ status: 404 });
  });

  it('lista com o voto da unidade e mostra quem votou quando foi outra pessoa', async () => {
    repo.listByCondominio.mockResolvedValue([
      { id: 5, meu_voto: 12, votado_por: 'Ana', votado_por_id: '2', total: 1, opcoes: [] },
    ]);
    const r = await svc.listar(morador);
    expect(repo.listByCondominio).toHaveBeenCalledWith('1', '4');
    expect(r).toMatchObject({ podeCriar: false, podeVotar: true });
    expect(r.enquetes[0]).toMatchObject({ meuVoto: 12, votadoPor: 'Ana' });
    const p = await svc.listar(portaria);
    expect(p).toMatchObject({ podeCriar: false, podeVotar: false });
  });
});

describe('validação da enquete', () => {
  it('exige de 2 a 10 opções sem repetição', () => {
    expect(enqueteSchema.safeParse(dados).success).toBe(true);
    expect(enqueteSchema.safeParse({ ...dados, opcoes: ['Sim'] }).success).toBe(false);
    expect(enqueteSchema.safeParse({ ...dados, opcoes: ['Sim', ' sim '] }).success).toBe(false);
    expect(
      enqueteSchema.safeParse({ ...dados, opcoes: Array.from({ length: 11 }, (_, i) => `${i}`) })
        .success,
    ).toBe(false);
  });

  it('descrição vazia vira indefinida; voto exige opção', () => {
    expect(enqueteSchema.parse({ ...dados, descricao: '  ' }).descricao).toBeUndefined();
    expect(votoSchema.safeParse({}).success).toBe(false);
    expect(votoSchema.parse({ opcaoId: '3' })).toEqual({ opcaoId: 3 });
  });
});
