/**
 * Rota da API: /api/auth/login
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';
import { clientIp, handleError, parseWith, readJson } from '@/lib/http';
import { loginSchema } from '@/lib/validators';
import { login } from '@/services/authService';

// POST /api/auth/login  { identificador (e-mail ou CPF), senha }
export async function POST(request) {
  try {
    const credenciais = parseWith(loginSchema, await readJson(request));
    const { token, usuario } = await login(credenciais, { ip: clientIp(request) });
    const response = NextResponse.json({ usuario });
    // Grava o token de sessão no cookie httpOnly do navegador.
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'auth/login');
  }
}
