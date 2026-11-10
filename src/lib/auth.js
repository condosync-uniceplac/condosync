/**
 * Criação e conferência do token de sessão (JWT) guardado no cookie do navegador.
 */

/*
 * Sessão via JWT (jose) em cookie httpOnly.
 * Este módulo é usado também pelo middleware.js (Edge Runtime), por isso não
 * importa nada de Node (pg, bcrypt, fs...).
 */
import { SignJWT, jwtVerify } from 'jose';

// Nome do cookie e duração da sessão (depois disso a pessoa precisa entrar de novo).
export const SESSION_COOKIE = 'condosync_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 horas

// Chave secreta usada para assinar o token; vem da variável de ambiente JWT_SECRET.
function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET ausente ou com menos de 32 caracteres');
  }
  return new TextEncoder().encode(secret);
}

/** Gera o token de sessão. Mantenha o payload mínimo (sem dados sensíveis). */
export async function signSession(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setSubject(String(payload.sub))
    .sign(secretKey());
}

/** Retorna o payload se o token for válido; caso contrário, null. */
export async function verifySession(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    return payload;
  } catch {
    return null;
  }
}

// Opções do cookie: httpOnly (o JavaScript da página não lê), secure em produção (só HTTPS)
// e sameSite=lax (não é enviado em requisições vindas de outros sites).
export function sessionCookieOptions(maxAge = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  };
}
