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
    return handleError(err, 'auth/forgot-password');
  }
}
