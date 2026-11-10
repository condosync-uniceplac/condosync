/**
 * Rota da API: /api/auth/reset-password/validate
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { handleError, readJson } from '@/lib/http';
import { resetTokenSchema } from '@/lib/validators';
import { isResetTokenValid } from '@/services/authService';

// POST /api/auth/reset-password/validate  { token } -> { valido: boolean }
// Usado pela tela de redefinição para avisar logo ao abrir que o link não vale mais.
export async function POST(request) {
  try {
    const parsed = resetTokenSchema.safeParse(await readJson(request));
    if (!parsed.success) return NextResponse.json({ valido: false });
    return NextResponse.json({ valido: await isResetTokenValid(parsed.data) });
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'auth/reset-password/validate');
  }
}
