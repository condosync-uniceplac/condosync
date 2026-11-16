/**
 * Rota da API: /api/auth/login
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { SESSION_COOKIE, cookieDaSessao } from '@/lib/auth';
import { clientIp, handleError, parseWith, readJson } from '@/lib/http';
import { loginSchema } from '@/lib/validators';
import { login } from '@/services/authService';

// POST /api/auth/login  { identificador (e-mail ou CPF), senha, lembrar? }
export async function POST(request) {
  try {
    const credenciais = parseWith(loginSchema, await readJson(request));
    const { token, usuario, lembrar } = await login(credenciais, { ip: clientIp(request) });
    const response = NextResponse.json({ usuario });
    // Grava o token no cookie httpOnly: 30 dias com "Lembrar de mim", senão até fechar o navegador.
    response.cookies.set(SESSION_COOKIE, token, cookieDaSessao(lembrar));
    return response;
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'auth/login');
  }
}
