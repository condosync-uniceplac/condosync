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
// Com "Lembrar de mim" marcado (RF.06), a sessão dura 30 dias.
export const SESSION_TTL_LEMBRAR_SECONDS = 60 * 60 * 24 * 30;

/** Duração do token: 30 dias se a pessoa pediu para ser lembrada (lb), senão 8 horas. */
export function duracaoSessao(lembrar) {
  return lembrar ? SESSION_TTL_LEMBRAR_SECONDS : SESSION_TTL_SECONDS;
}

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
    .setExpirationTime(`${duracaoSessao(payload.lb)}s`)
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
// maxAge undefined = cookie de sessão do navegador (some ao fechar o navegador); 0 = apagar.
export function sessionCookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(maxAge === undefined ? {} : { maxAge }),
  };
}

/** Cookie do login: dura 30 dias com "Lembrar de mim"; sem ele, termina ao fechar o navegador. */
export function cookieDaSessao(lembrar) {
  return sessionCookieOptions(lembrar ? SESSION_TTL_LEMBRAR_SECONDS : undefined);
}
