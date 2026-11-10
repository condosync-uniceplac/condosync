/**
 * Rota da API: /api/auth/sessao-expirada
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';

// GET /api/auth/sessao-expirada — limpa o cookie de uma sessão que deixou de valer
// (perfil ou unidade alterados) e leva ao login.
export async function GET(request) {
  const response = NextResponse.redirect(new URL('/login?sessao=expirada', request.url));
  // Grava o token de sessão no cookie httpOnly do navegador.
  response.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0));
  return response;
}
