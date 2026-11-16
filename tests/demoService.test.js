/**
 * Testes da conta rápida de demonstração (QR code): código, validade, nome, limite e perfil só leitura.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ withTransaction: (fn) => fn('tx'), query: vi.fn() }));
vi.mock('@/repositories/demoRepository', () => ({
  condominioPadrao: vi.fn(),
  unidadeMenosOcupada: vi.fn(),
  contarContasDemo: vi.fn(),
  criarUsuarioDemo: vi.fn(),
}));
vi.mock('@/repositories/termosRepository', () => ({
  listVigentes: vi.fn(),
  registrarAceites: vi.fn(),
}));
vi.mock('@/repositories/vinculosRepository', () => ({
  create: vi.fn(),
  listAtivosByUsuario: vi.fn(),
  derrubarSessoesDoUsuario: vi.fn(),
}));
vi.mock('@/repositories/usuariosRepository', () => ({
  atualizarTelefone: vi.fn(),
  findSenhaHash: vi.fn(),
}));

const demoRepo = await import('@/repositories/demoRepository');
const termos = await import('@/repositories/termosRepository');
const vinculos = await import('@/repositories/vinculosRepository');
const usuarios = await import('@/repositories/usuariosRepository');
const svc = await import('@/services/demoService');
const perfil = await import('@/services/perfilService');
const { demoSchema } = await import('@/lib/validators');

const CODIGO = 'codigo-secreto-de-teste-123';

function cpfValido(cpf) {
  const n = cpf.split('').map(Number);
  const dv = (k) => {
    const s = n.slice(0, k).reduce((acc, d, i) => acc + d * (k + 1 - i), 0);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return /^\d{11}$/.test(cpf) && dv(9) === n[9] && dv(10) === n[10];
}

describe('demoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DEMO_CODIGO = CODIGO;
    delete process.env.DEMO_ATE;
    demoRepo.contarContasDemo.mockResolvedValue(0);
    demoRepo.condominioPadrao.mockResolvedValue(1);
    demoRepo.unidadeMenosOcupada.mockResolvedValue(7);
    demoRepo.criarUsuarioDemo.mockResolvedValue({ id: 50, nome_completo: 'Ana' });
    termos.listVigentes.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    vinculos.listAtivosByUsuario.mockResolvedValue([
      {
        id: 90,
        perfil: 'MORADOR',
        condominio_id: 1,
        condominio_nome: 'Vila Aurora',
        unidade_id: 7,
        sessao_versao: 0,
      },
    ]);
  });
  afterEach(() => {
    delete process.env.DEMO_CODIGO;
    delete process.env.DEMO_ATE;
  });

  it('desligada sem DEMO_CODIGO, ligada com ele e desligada depois de DEMO_ATE', () => {
    expect(svc.demoAtiva()).toBe(true);
    process.env.DEMO_ATE = '2000-01-01T00:00:00Z';
    expect(svc.demoAtiva()).toBe(false);
    delete process.env.DEMO_ATE;
    delete process.env.DEMO_CODIGO;
    expect(svc.demoAtiva()).toBe(false);
  });

  it('recusa código errado ou vazio', async () => {
    expect(svc.codigoValido('errado')).toBe(false);
    expect(svc.codigoValido(undefined)).toBe(false);
    await expect(svc.entrar({ codigo: 'errado', nome: 'Ana' })).rejects.toMatchObject({
      status: 404,
    });
    expect(demoRepo.criarUsuarioDemo).not.toHaveBeenCalled();
  });

  it('cria morador ativo na unidade menos ocupada e devolve sessão marcada como demo', async () => {
    const sessao = await svc.entrar({ codigo: CODIGO, nome: 'Ana' });
    const criado = demoRepo.criarUsuarioDemo.mock.calls[0][0];
    expect(criado.email).toMatch(/^demo-.+@demo\.condosync\.dev$/);
    expect(cpfValido(criado.cpf)).toBe(true);
    expect(vinculos.create).toHaveBeenCalledWith(
      expect.objectContaining({ perfil: 'MORADOR', unidadeId: 7, ativo: true }),
      'tx',
    );
    expect(termos.registrarAceites).toHaveBeenCalled();
    expect(sessao).toMatchObject({ sub: '50', perfil: 'MORADOR', unidadeId: '7', demo: true });
  });

  it('respeita o limite de participantes', async () => {
    demoRepo.contarContasDemo.mockResolvedValue(svc.LIMITE_CONTAS);
    await expect(svc.entrar({ codigo: CODIGO, nome: 'Ana' })).rejects.toMatchObject({
      status: 429,
    });
  });

  it('gera CPFs válidos', () => {
    for (let i = 0; i < 50; i += 1) expect(cpfValido(svc.gerarCpf())).toBe(true);
  });

  it('nome: só letras e espaços, de 2 a 30 caracteres', () => {
    expect(demoSchema.parse({ codigo: 'x', nome: '  Ana   Clara ' }).nome).toBe('Ana Clara');
    expect(demoSchema.parse({ codigo: 'x', nome: 'João' }).nome).toBe('João');
    for (const nome of ['A', 'Ana123', 'www.site.com', 'a'.repeat(31), '<b>oi</b>']) {
      expect(demoSchema.safeParse({ codigo: 'x', nome }).success).toBe(false);
    }
  });

  it('conta de demonstração não altera telefone nem senha', async () => {
    const sessao = { sub: '50', demo: true };
    await expect(
      perfil.atualizarTelefone(sessao, { telefone: '61999990000' }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      perfil.trocarSenha(sessao, { senhaAtual: 'a', novaSenha: 'b' }),
    ).rejects.toMatchObject({ status: 403 });
    expect(usuarios.atualizarTelefone).not.toHaveBeenCalled();
  });
});
