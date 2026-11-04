import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/repositories/vinculosRepository', () => ({
  findPendente: vi.fn(),
  ativar: vi.fn(),
  remover: vi.fn(),
  listPendentesByCondominio: vi.fn(),
}));

const vinculosRepo = await import('@/repositories/vinculosRepository');
const { aprovar, recusar } = await import('@/services/cadastrosService');

const sindico = { sub: '3', perfil: 'SINDICO', condominioId: '1' };

describe('cadastrosService (RF.03 / RN.04)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('aprova um cadastro pendente do próprio condomínio', async () => {
    vinculosRepo.findPendente.mockResolvedValue({ id: 10 });
    await aprovar(sindico, 10);
    expect(vinculosRepo.findPendente).toHaveBeenCalledWith(10, '1');
    expect(vinculosRepo.ativar).toHaveBeenCalledWith(10);
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
