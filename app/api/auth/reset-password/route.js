/**
 * Rota da API: /api/auth/reset-password
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { handleError, parseWith, readJson } from '@/lib/http';
import { resetPasswordSchema } from '@/lib/validators';
import { resetPassword } from '@/services/authService';

// POST /api/auth/reset-password  { token, senha }
export async function POST(request) {
  try {
    const data = parseWith(resetPasswordSchema, await readJson(request));
    await resetPassword(data);
    return NextResponse.json({ message: 'Senha redefinida com sucesso.' });
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'auth/reset-password');
  }
}
