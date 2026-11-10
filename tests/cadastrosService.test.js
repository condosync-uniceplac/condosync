import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ withTransaction: (fn) => fn('tx'), query: vi.fn() }));
vi.mock('@/repositories/condominiosRepository', () => ({ findUnidade: vi.fn() }));
vi.mock('@/repositories/vinculosRepository', () => ({
  findPendente: vi.fn(),
  ativar: vi.fn(),
  definirUnidade: vi.fn(),
  remover: vi.fn(),
  listPendentesByCondominio: vi.fn(),
}));

const vinculosRepo = await import('@/repositories/vinculosRepository');
const condominiosRepo = await import('@/repositories/condominiosRepository');
const { aprovar, recusar } = await import('@/services/cadastrosService');

const sindico = { sub: '3', perfil: 'SINDICO', condominioId: '1' };

describe('cadastrosService (RF.03 / RN.04)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('aprova um cadastro pendente do próprio condomínio', async () => {
    vinculosRepo.findPendente.mockResolvedValue({ id: 10 });
    await aprovar(sindico, 10);
    expect(vinculosRepo.findPendente).toHaveBeenCalledWith(10, '1');
    expect(vinculosRepo.ativar).toHaveBeenCalledWith(10, 'tx');
    expect(vinculosRepo.definirUnidade).not.toHaveBeenCalled();
  });

  it('síndico corrige a unidade informada antes de aprovar (RN.04 revisada)', async () => {
    vinculosRepo.findPendente.mockResolvedValue({ id: 10, perfil: 'MORADOR', unidade_id: 5 });
    condominiosRepo.findUnidade.mockResolvedValue({ id: 6, condominio_id: 1 });
    await aprovar(sindico, 10, { unidadeId: 6 });
    expect(vinculosRepo.definirUnidade).toHaveBeenCalledWith(
      10,
      6,
      { derrubarSessao: false },
      'tx',
    );
    expect(vinculosRepo.ativar).toHaveBeenCalledWith(10, 'tx');
  });

  it('não aceita unidade de outro condomínio na correção', async () => {
    vinculosRepo.findPendente.mockResolvedValue({ id: 10, perfil: 'MORADOR', unidade_id: 5 });
    condominiosRepo.findUnidade.mockResolvedValue({ id: 99, condominio_id: 2 });
    await expect(aprovar(sindico, 10, { unidadeId: 99 })).rejects.toMatchObject({ status: 422 });
    expect(vinculosRepo.ativar).not.toHaveBeenCalled();
  });

  it('recusa um cadastro pendente removendo o vínculo', async () => {
    vinculosRepo.findPendente.mockResolvedValue({ id: 11 });
    await recusar(sindico, 11);
    expect(vinculosRepo.remover).toHaveBeenCalledWith(11);
  });

  it('não age em cadastro de outro condomínio ou já aprovado', async () => {
    vinculosRepo.findPendente.mockResolvedValue(null);
    await expect(aprovar(sindico, 99)).rejects.toMatchObject({ status: 404 });
    expect(vinculosRepo.ativar).not.toHaveBeenCalled();
  });
});
