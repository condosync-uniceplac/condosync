/**
 * Testes automatizados (Vitest) da página Meu perfil (perfilService): dados, telefone e troca de senha.
 * Rodam com `npm test` e em todo Pull Request (GitHub Actions).
 * describe agrupa os casos; cada it(...) é um caso de teste; expect(...) confere o resultado.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock troca o banco/repositórios por funções falsas: o teste confere só a regra de negócio,
// sem precisar de um banco de verdade.
vi.mock('@/lib/db', () => ({ withTransaction: (fn) => fn('tx'), query: vi.fn() }));
vi.mock('@/repositories/usuariosRepository', () => ({
  findPerfil: vi.fn(),
  findSenhaHash: vi.fn(),
  atualizarSenha: vi.fn(),
  atualizarTelefone: vi.fn(),
}));
vi.mock('@/repositories/vinculosRepository', () => ({ derrubarSessoesDoUsuario: vi.fn() }));
vi.mock('@/repositories/condominiosRepository', () => ({ findUnidade: vi.fn() }));

const usuarios = await import('@/repositories/usuariosRepository');
const vinculos = await import('@/repositories/vinculosRepository');
const condominios = await import('@/repositories/condominiosRepository');
const svc = await import('@/services/perfilService');
const { hashPassword } = await import('@/lib/password');
const { trocaSenhaSchema, telefonePerfilSchema } = await import('@/lib/validators');

const morador = {
  sub: '1',
  perfil: 'MORADOR',
  vinculoId: '10',
  unidadeId: '4',
  condominioNome: 'Residencial Vila Aurora',
};

describe('perfilService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mostra os próprios dados com CPF mascarado e a unidade', async () => {
    usuarios.findPerfil.mockResolvedValue({
      nome_completo: 'Joao Silva',
      email: 'joao@x.com',
      telefone: '61988887777',
      cpf: '52998224725',
    });
    condominios.findUnidade.mockResolvedValue({ numero: '101', bloco: 'A' });
    const p = await svc.obter(morador);
    expect(usuarios.findPerfil).toHaveBeenCalledWith('1');
    expect(p).toMatchObject({
      cpf: '529.***.***-25',
      telefone: '(61) 98888-7777',
      perfil: 'Morador',
      unidade: 'Apto 101 - Bloco A',
    });
    expect(p).not.toHaveProperty('senha_hash');
  });

  it('atualiza o telefone da própria pessoa', async () => {
    await svc.atualizarTelefone(morador, { telefone: '61988887777' });
    expect(usuarios.atualizarTelefone).toHaveBeenCalledWith('1', '61988887777');
  });

  it('troca a senha conferindo a atual e derruba as outras sessões', async () => {
    usuarios.findSenhaHash.mockResolvedValue(await hashPassword('Condo@2026'));
    vinculos.derrubarSessoesDoUsuario.mockResolvedValue([{ id: 10, sessao_versao: 3 }]);
    const r = await svc.trocarSenha(morador, { senhaAtual: 'Condo@2026', novaSenha: 'Nova@2026x' });
    expect(usuarios.atualizarSenha).toHaveBeenCalledWith('1', expect.any(String), 'tx');
    expect(vinculos.derrubarSessoesDoUsuario).toHaveBeenCalledWith('1', 'tx');
    expect(r).toEqual({ sv: 3 });
  });

  it('recusa senha atual errada e nova igual à atual', async () => {
    usuarios.findSenhaHash.mockResolvedValue(await hashPassword('Condo@2026'));
    await expect(
      svc.trocarSenha(morador, { senhaAtual: 'errada', novaSenha: 'Nova@2026x' }),
    ).rejects.toMatchObject({ status: 422, details: { senhaAtual: expect.any(String) } });
    await expect(
      svc.trocarSenha(morador, { senhaAtual: 'Condo@2026', novaSenha: 'Condo@2026' }),
    ).rejects.toMatchObject({ status: 422, details: { novaSenha: expect.any(String) } });
    expect(usuarios.atualizarSenha).not.toHaveBeenCalled();
  });
});

describe('validação do perfil', () => {
  it('telefone com DDD e confirmação da nova senha', () => {
    expect(telefonePerfilSchema.parse({ telefone: '(61) 98888-7777' })).toEqual({
      telefone: '61988887777',
    });
    expect(telefonePerfilSchema.safeParse({ telefone: '9888' }).success).toBe(false);
    expect(
      trocaSenhaSchema.safeParse({ senhaAtual: 'x', novaSenha: 'Nova@2026x', confirmacao: 'outra' })
        .success,
    ).toBe(false);
    expect(
      trocaSenhaSchema.safeParse({ senhaAtual: 'x', novaSenha: 'fraca', confirmacao: 'fraca' })
        .success,
    ).toBe(false);
  });
});
