/**
 * Rota da API: /api/auth/logout
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';

// POST /api/auth/logout
export async function POST() {
  const response = new NextResponse(null, { status: 204 });
  // Grava o token de sessão no cookie httpOnly do navegador.
  response.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0));
  return response;
}
