/**
 * Rota da API: /api/demo/entrar (conta rápida de demonstração do QR code).
 * Cria o morador de demonstração e já grava o cookie de sessão.
 */

import { NextResponse } from 'next/server';
import { SESSION_COOKIE, cookieDaSessao, signSession } from '@/lib/auth';
import { clientIp, handleError, parseWith, readJson } from '@/lib/http';
import { demoSchema } from '@/lib/validators';
import { entrar } from '@/services/demoService';

// POST /api/demo/entrar  { codigo, nome }
export async function POST(request) {
  try {
    const dados = parseWith(demoSchema, await readJson(request));
    const sessao = await entrar(dados, { ip: clientIp(request) });
    const response = NextResponse.json({ ok: true }, { status: 201 });
    // Sessão comum do navegador (some ao fechar), sem "Lembrar de mim".
    response.cookies.set(SESSION_COOKIE, await signSession(sessao), cookieDaSessao(false));
    return response;
  } catch (err) {
    return handleError(err, 'demo/entrar');
  }
}
