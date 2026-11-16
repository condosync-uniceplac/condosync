/**
 * Testes do "Lembrar de mim" (RF.06): duração do token e do cookie de sessão.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import {
  SESSION_TTL_LEMBRAR_SECONDS,
  SESSION_TTL_SECONDS,
  cookieDaSessao,
  duracaoSessao,
  sessionCookieOptions,
  signSession,
  verifySession,
} from '@/lib/auth';
import { loginSchema } from '@/lib/validators';

beforeAll(() => {
  process.env.JWT_SECRET ??= 'segredo-de-teste-com-mais-de-32-caracteres';
});

describe('Lembrar de mim', () => {
  it('sem lembrar: token de 8 horas e cookie que some ao fechar o navegador', async () => {
    expect(duracaoSessao(false)).toBe(SESSION_TTL_SECONDS);
    expect(cookieDaSessao(false)).not.toHaveProperty('maxAge');
    const p = await verifySession(await signSession({ sub: '1' }));
    expect(p.exp - p.iat).toBe(8 * 60 * 60);
  });

  it('com lembrar: token e cookie de 30 dias', async () => {
    expect(cookieDaSessao(true).maxAge).toBe(SESSION_TTL_LEMBRAR_SECONDS);
    const p = await verifySession(await signSession({ sub: '1', lb: true }));
    expect(p.exp - p.iat).toBe(30 * 24 * 60 * 60);
  });

  it('sessionCookieOptions(0) continua apagando o cookie (logout)', () => {
    expect(sessionCookieOptions(0).maxAge).toBe(0);
  });

  it('o login aceita "lembrar" e assume falso quando não vem', () => {
    const base = { identificador: 'joao@x.com', senha: 'x' };
    expect(loginSchema.parse(base).lembrar).toBe(false);
    expect(loginSchema.parse({ ...base, lembrar: true }).lembrar).toBe(true);
    expect(loginSchema.safeParse({ ...base, lembrar: 'sim' }).success).toBe(false);
  });
});
