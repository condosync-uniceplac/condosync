/**
 * Rota da API: /api/perfil/senha
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { SESSION_COOKIE, sessionCookieOptions, signSession } from '@/lib/auth';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { trocaSenhaSchema } from '@/lib/validators';
import { trocarSenha } from '@/services/perfilService';

// POST /api/perfil/senha  { senhaAtual, novaSenha, confirmacao }
export async function POST(request) {
  try {
    const session = await requireSession();
    const dados = parseWith(trocaSenhaSchema, await readJson(request));
    const { sv } = await trocarSenha(session, dados);
    // As outras sessões caíram; esta continua com um token novo (nova versão de sessão).
    // eslint-disable-next-line no-unused-vars
    const { iat, exp, ...payload } = session;
    const token = await signSession({ ...payload, sv });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (err) {
    return handleError(err, 'perfil/senha');
  }
}
