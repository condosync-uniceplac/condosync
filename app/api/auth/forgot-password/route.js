/**
 * Rota da API: /api/auth/forgot-password
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { handleError, parseWith, readJson } from '@/lib/http';
import { forgotPasswordSchema } from '@/lib/validators';
import { requestPasswordReset } from '@/services/authService';

// POST /api/auth/forgot-password  { email }
// Resposta sempre igual, exista ou não o e-mail (evita enumeração de usuários).
export async function POST(request) {
  try {
    const data = parseWith(forgotPasswordSchema, await readJson(request));
    await requestPasswordReset(data);
    return NextResponse.json(
      { message: 'Se o e-mail estiver cadastrado, você receberá as instruções em instantes.' },
      { status: 202 },
    );
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'auth/forgot-password');
  }
}
