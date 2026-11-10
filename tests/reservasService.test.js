/**
 * Testes automatizados (Vitest) de turnos e reservas (reservasService): conflitos, capacidade e cancelamento.
 * Rodam com `npm test` e em todo Pull Request (GitHub Actions).
 * describe agrupa os casos; cada it(...) é um caso de teste; expect(...) confere o resultado.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock troca o banco/repositórios por funções falsas: o teste confere só a regra de negócio,
// sem precisar de um banco de verdade.
vi.mock('@/lib/db', () => ({ withTransaction: (fn) => fn('tx'), query: vi.fn() }));
vi.mock('@/repositories/reservasRepository', () => ({
  listEspacos: vi.fn(),
  listAtivas: vi.fn(),
  listOcupacao: vi.fn(),
  findEspacoParaReserva: vi.fn(),
  travarMorador: vi.fn(),
  existeConflitoEspaco: vi.fn(),
  existeConflitoMorador: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  cancelar: vi.fn(),
}));

const repo = await import('@/repositories/reservasRepository');
const { criar, cancelar, listar } = await import('@/services/reservasService');
const { intervaloDoTurno, sobrepoe, turnoDaReserva } = await import('@/lib/turnos');

const morador = { sub: '1', perfil: 'MORADOR', condominioId: '1', vinculoId: '10' };
const outroMorador = { ...morador, sub: '2', vinculoId: '11' };
const sindico = { sub: '3', perfil: 'SINDICO', condominioId: '1', vinculoId: '30' };
const portaria = { sub: '4', perfil: 'PORTARIA', condominioId: '1', vinculoId: '40' };
const agora = new Date('2026-11-05T12:00:00-03:00');
const pedido = { espacoId: 1, data: '2026-11-10', turno: 'NOITE', convidados: 20 };

describe('turnos', () => {
  it('converte data + turno no horário de Brasília', () => {
    const { inicio, fim } = intervaloDoTurno('2026-11-10', 'NOITE');
    expect(inicio.toISOString()).toBe('2026-11-10T21:00:00.000Z');
    expect(fim.toISOString()).toBe('2026-11-11T02:00:00.000Z');
    expect(turnoDaReserva(inicio, fim).id).toBe('NOITE');
  });

  it('o dia inteiro conflita com os outros turnos; manhã e tarde não', () => {
    const dia = intervaloDoTurno('2026-11-10', 'DIA');
    const manha = intervaloDoTurno('2026-11-10', 'MANHA');
    const tarde = intervaloDoTurno('2026-11-10', 'TARDE');
    expect(sobrepoe(dia, tarde)).toBe(true);
    expect(sobrepoe(manha, tarde)).toBe(false);
  });
});

describe('reservasService — criar (RF.09 / RN.12)', () => {
  // Antes de cada teste: zera as funções falsas e define as respostas padrão.
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findEspacoParaReserva.mockResolvedValue({
      id: 1,
      nome: 'Salão de Festas',
      capacidade_pessoas: 80,
      valor: '250.00',
    });
    repo.existeConflitoEspaco.mockResolvedValue(false);
    repo.existeConflitoMorador.mockResolvedValue(false);
    repo.create.mockResolvedValue({ id: 99 });
  });

  it('cria a reserva confirmada com o valor do espaço', async () => {
    const r = await criar(morador, pedido, agora);
    expect(r.id).toBe(99);
    expect(repo.travarMorador).toHaveBeenCalledWith('10', 'tx');
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ espacoId: 1, vinculoId: '10', convidados: 20, valor: '250.00' }),
      'tx',
    );
  });

  it('recusa quando o espaço já está reservado no horário', async () => {
    repo.existeConflitoEspaco.mockResolvedValue(true);
    await expect(criar(morador, pedido, agora)).rejects.toMatchObject({ status: 409 });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('recusa quando o morador já tem outra reserva no mesmo horário', async () => {
    repo.existeConflitoMorador.mockResolvedValue(true);
    await expect(criar(morador, pedido, agora)).rejects.toMatchObject({
      status: 409,
      message: 'Você já tem outra reserva nesse horário.',
    });
  });

  it('recusa data passada e convidados acima da capacidade', async () => {
    await expect(criar(morador, { ...pedido, data: '2026-11-01' }, agora)).rejects.toMatchObject({
      status: 422,
    });
    await expect(criar(morador, { ...pedido, convidados: 81 }, agora)).rejects.toMatchObject({
      status: 422,
    });
  });

  it('síndico que mora no condomínio também reserva', async () => {
    await criar({ ...sindico, unidadeId: '101' }, pedido, agora);
    expect(repo.create).toHaveBeenCalled();
  });

  it('só moradores reservam', async () => {
    await expect(criar(sindico, pedido, agora)).rejects.toMatchObject({ status: 403 });
    await expect(criar(portaria, pedido, agora)).rejects.toMatchObject({ status: 403 });
  });

  it('espaço de outro condomínio não é encontrado', async () => {
    repo.findEspacoParaReserva.mockResolvedValue(null);
    await expect(criar(morador, pedido, agora)).rejects.toMatchObject({ status: 404 });
  });
});

describe('reservasService — cancelar', () => {
  const daqui = (horas) => new Date(agora.getTime() + horas * 3600_000);
  beforeEach(() => vi.clearAllMocks());

  it('morador cancela a própria reserva com 24 h de antecedência', async () => {
    repo.findById.mockResolvedValue({
      id: 5,
      vinculo_id: 10,
      inicio: daqui(48),
      status: 'CONFIRMADA',
    });
    await cancelar(morador, 5, agora);
    expect(repo.cancelar).toHaveBeenCalledWith(5);
  });

  it('morador não cancela em cima da hora, mas o síndico pode', async () => {
    repo.findById.mockResolvedValue({
      id: 5,
      vinculo_id: 10,
      inicio: daqui(3),
      status: 'CONFIRMADA',
    });
    await expect(cancelar(morador, 5, agora)).rejects.toMatchObject({ status: 422 });
    await cancelar(sindico, 5, agora);
    expect(repo.cancelar).toHaveBeenCalledTimes(1);
  });

  it('morador não cancela reserva de outro morador', async () => {
    repo.findById.mockResolvedValue({
      id: 5,
      vinculo_id: 10,
      inicio: daqui(48),
      status: 'CONFIRMADA',
    });
    await expect(cancelar(outroMorador, 5, agora)).rejects.toMatchObject({ status: 404 });
    await expect(cancelar(portaria, 5, agora)).rejects.toMatchObject({ status: 403 });
    expect(repo.cancelar).not.toHaveBeenCalled();
  });

  it('não cancela reserva já cancelada', async () => {
    repo.findById.mockResolvedValue({
      id: 5,
      vinculo_id: 10,
      inicio: daqui(48),
      status: 'CANCELADA',
    });
    await expect(cancelar(morador, 5, agora)).rejects.toMatchObject({ status: 409 });
  });
});

describe('reservasService — listar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.listEspacos.mockResolvedValue([]);
    repo.listAtivas.mockResolvedValue([]);
    repo.listOcupacao.mockResolvedValue([]);
  });

  it('morador vê só as próprias reservas; síndico e portaria veem todas', async () => {
    await listar(morador);
    expect(repo.listAtivas).toHaveBeenLastCalledWith('1', { vinculoId: '10' });
    await listar(sindico);
    expect(repo.listAtivas).toHaveBeenLastCalledWith('1', { vinculoId: null });
    expect((await listar(portaria)).podeReservar).toBe(false);
  });
});
