import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ withTransaction: vi.fn((fn) => fn({})), query: vi.fn() }));
vi.mock('@/lib/password', () => ({
  hashPassword: vi.fn(async () => 'novo-hash'),
  verifyPassword: vi.fn(),
}));
vi.mock('@/repositories/recuperacoesSenhaRepository', () => ({
  findValido: vi.fn(),
  marcarUsado: vi.fn(),
  invalidarPendentes: vi.fn(),
}));
vi.mock('@/repositories/usuariosRepository', () => ({
  findSenhaHash: vi.fn(),
  atualizarSenha: vi.fn(),
}));

const password = await import('@/lib/password');
const recuperacoesRepo = await import('@/repositories/recuperacoesSenhaRepository');
const usuariosRepo = await import('@/repositories/usuariosRepository');
const { resetPassword } = await import('@/services/authService');

const token = 'x'.repeat(43);

describe('resetPassword (RF.07)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recuperacoesRepo.findValido.mockResolvedValue({ id: 1, usuario_id: 5 });
    usuariosRepo.findSenhaHash.mockResolvedValue('hash-atual');
  });

  it('recusa nova senha igual à senha atual (#20)', async () => {
    password.verifyPassword.mockResolvedValue(true);
    await expect(resetPassword({ token, senha: 'Condo@2026' })).rejects.toMatchObject({
      status: 422,
      details: { senha: 'A nova senha deve ser diferente da senha atual.' },
    });
    expect(usuariosRepo.atualizarSenha).not.toHaveBeenCalled();
    expect(recuperacoesRepo.marcarUsado).not.toHaveBeenCalled();
  });

  it('troca a senha quando ela é diferente da atual', async () => {
    password.verifyPassword.mockResolvedValue(false);
    await resetPassword({ token, senha: 'Nova@2026' });
    expect(usuariosRepo.atualizarSenha).toHaveBeenCalledWith(5, 'novo-hash', {});
    expect(recuperacoesRepo.marcarUsado).toHaveBeenCalledWith(1, {});
  });

  it('recusa link inválido ou expirado', async () => {
    recuperacoesRepo.findValido.mockResolvedValue(null);
    await expect(resetPassword({ token, senha: 'Nova@2026' })).rejects.toMatchObject({
      status: 400,
    });
  });
});

describe('isResetTokenValid (CT-28)', () => {
  it('é falso para link já usado ou expirado', async () => {
    recuperacoesRepo.findValido.mockResolvedValue(null);
    const { isResetTokenValid } = await import('@/services/authService');
    await expect(isResetTokenValid({ token })).resolves.toBe(false);
  });

  it('é verdadeiro para link válido', async () => {
    recuperacoesRepo.findValido.mockResolvedValue({ id: 1, usuario_id: 5 });
    const { isResetTokenValid } = await import('@/services/authService');
    await expect(isResetTokenValid({ token })).resolves.toBe(true);
  });
});
