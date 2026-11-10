/**
 * Testes automatizados (Vitest) de portaria e visitantes (visitasService): pré-autorização, não previsto e ações.
 * Rodam com `npm test` e em todo Pull Request (GitHub Actions).
 * describe agrupa os casos; cada it(...) é um caso de teste; expect(...) confere o resultado.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock troca o banco/repositórios por funções falsas: o teste confere só a regra de negócio,
// sem precisar de um banco de verdade.
vi.mock('@/lib/db', () => ({ query: vi.fn(), withTransaction: vi.fn() }));
vi.mock('@/repositories/visitasRepository', () => ({
  upsertVisitante: vi.fn(),
  create: vi.fn(),
  listDaUnidade: vi.fn(),
  listDoCondominio: vi.fn(),
  findById: vi.fn(),
  transicionar: vi.fn(),
}));
vi.mock('@/repositories/condominiosRepository', () => ({
  listUnidades: vi.fn(),
  findUnidade: vi.fn(),
}));

const repo = await import('@/repositories/visitasRepository');
const condRepo = await import('@/repositories/condominiosRepository');
const { executarAcao, listar, preAutorizar, registrarNaoPrevisto } =
  await import('@/services/visitasService');
const { mascararDocumento } = await import('@/lib/masks');
const { preAutorizacaoSchema, visitaNaoPrevistaSchema } = await import('@/lib/validators');

const morador = {
  perfil: 'MORADOR',
  condominioId: '1',
  vinculoId: '10',
  unidadeId: '101',
};
const vizinho = { ...morador, vinculoId: '11', unidadeId: '102' };
const portaria = { perfil: 'PORTARIA', condominioId: '1', vinculoId: '40', unidadeId: null };
const agora = new Date('2026-11-09T10:00:00-03:00');
const visitante = { nome: 'Aline Rodrigues', tipoDocumento: 'CPF', documento: '52998224725' };

describe('documento mascarado (LGPD)', () => {
  it('mostra só o começo e o fim do CPF', () => {
    expect(mascararDocumento('CPF', '38422190012')).toBe('384.***.***-12');
    expect(mascararDocumento('RG', '1234567')).toBe('****567');
  });
});

describe('validação do visitante', () => {
  it('aceita CPF com máscara e placa nos dois formatos', () => {
    const ok = preAutorizacaoSchema.safeParse({
      ...visitante,
      documento: '529.982.247-25',
      placa: 'abc-1234',
      previsao: '2026-11-09T14:30',
    });
    expect(ok.success).toBe(true);
    expect(ok.data.documento).toBe('52998224725');
    expect(ok.data.placa).toBe('ABC1234');
    expect(
      visitaNaoPrevistaSchema.safeParse({ ...visitante, placa: 'ABC1D23', unidadeId: 3 }).success,
    ).toBe(true);
  });

  it('recusa CPF inválido e placa inválida', () => {
    const r = preAutorizacaoSchema.safeParse({
      ...visitante,
      documento: '111.111.111-11',
      placa: '12345',
      previsao: '2026-11-09T14:30',
    });
    expect(r.success).toBe(false);
  });
});

describe('visitasService — RN.14', () => {
  // Antes de cada teste: zera as funções falsas e define as respostas padrão.
  beforeEach(() => {
    vi.clearAllMocks();
    repo.upsertVisitante.mockResolvedValue(7);
    repo.create.mockResolvedValue({ id: 50, codigo_convite: 'a1b2c3d4-0000' });
    repo.transicionar.mockResolvedValue(true);
  });

  it('morador pré-autoriza: visita já nasce AUTORIZADA para a unidade dele', async () => {
    const r = await preAutorizar(morador, { ...visitante, previsao: '2026-11-09T14:30' }, agora);
    expect(r.convite).toBe('A1B2C3D4');
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        unidadeId: '101',
        status: 'AUTORIZADO',
        autorizadoPorId: '10',
        autorizacaoVia: 'PRE_AUTORIZACAO',
      }),
    );
  });

  it('pré-autorização recusa horário que já passou', async () => {
    await expect(
      preAutorizar(morador, { ...visitante, previsao: '2026-11-08T14:30' }, agora),
    ).rejects.toMatchObject({ status: 422 });
  });

  it('portaria registra visitante não previsto, que fica AGUARDANDO o morador', async () => {
    condRepo.findUnidade.mockResolvedValue({ id: 101, condominio_id: 1 });
    await registrarNaoPrevisto(portaria, { ...visitante, unidadeId: 101 });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'AGUARDANDO', registradaPorId: '40' }),
    );
    expect(repo.create.mock.calls[0][0].autorizadoPorId).toBeUndefined();
  });

  it('portaria não registra visita para unidade de outro condomínio', async () => {
    condRepo.findUnidade.mockResolvedValue({ id: 900, condominio_id: 2 });
    await expect(
      registrarNaoPrevisto(portaria, { ...visitante, unidadeId: 900 }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it('morador confirma pelo app e a portaria pelo interfone (fica registrado)', async () => {
    repo.findById.mockResolvedValue({ id: 50, unidade_id: 101, status: 'AGUARDANDO' });
    await executarAcao(morador, 50, 'AUTORIZAR');
    expect(repo.transicionar).toHaveBeenLastCalledWith(50, 'AGUARDANDO', 'AUTORIZADO', {
      autorizadoPorId: '10',
      autorizacaoVia: 'APP',
    });
    await executarAcao(portaria, 50, 'AUTORIZAR');
    expect(repo.transicionar).toHaveBeenLastCalledWith(50, 'AGUARDANDO', 'AUTORIZADO', {
      autorizadoPorId: '40',
      autorizacaoVia: 'INTERFONE',
    });
  });

  it('não entra visitante que ainda aguarda o morador', async () => {
    repo.findById.mockResolvedValue({ id: 50, unidade_id: 101, status: 'AGUARDANDO' });
    await expect(executarAcao(portaria, 50, 'ENTRADA')).rejects.toMatchObject({ status: 409 });
  });

  it('portaria registra entrada e saída; morador não', async () => {
    repo.findById.mockResolvedValue({ id: 50, unidade_id: 101, status: 'AUTORIZADO' });
    await executarAcao(portaria, 50, 'ENTRADA');
    expect(repo.transicionar).toHaveBeenLastCalledWith(50, 'AUTORIZADO', 'PRESENTE', {});
    await expect(executarAcao(morador, 50, 'ENTRADA')).rejects.toMatchObject({ status: 403 });
  });

  it('morador não mexe em visita de outra unidade', async () => {
    repo.findById.mockResolvedValue({ id: 50, unidade_id: 101, status: 'AGUARDANDO' });
    await expect(executarAcao(vizinho, 50, 'AUTORIZAR')).rejects.toMatchObject({ status: 404 });
  });

  it('se outra pessoa já mudou a visita, responde 409', async () => {
    repo.findById.mockResolvedValue({ id: 50, unidade_id: 101, status: 'PRESENTE' });
    repo.transicionar.mockResolvedValue(false);
    await expect(executarAcao(portaria, 50, 'SAIDA')).rejects.toMatchObject({ status: 409 });
  });

  it('morador lista só a própria unidade, com o documento mascarado', async () => {
    repo.listDaUnidade.mockResolvedValue([
      {
        id: 1,
        unidade_id: 101,
        status: 'AUTORIZADO',
        nome: 'Aline',
        tipo_documento: 'CPF',
        documento: '38422190012',
        unidade_numero: '101',
        bloco_nome: 'A',
        codigo_convite: 'abcdef12-xx',
        placa_veiculo: 'ABC1234',
      },
    ]);
    const r = await listar(morador);
    expect(repo.listDaUnidade).toHaveBeenCalledWith('101');
    expect(r.visitas[0].documento).toBe('CPF 384.***.***-12');
    expect(r.visitas[0].placa).toBe('ABC-1234');
  });
});
