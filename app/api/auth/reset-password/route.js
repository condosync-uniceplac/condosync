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
    return handleError(err, 'auth/reset-password');
  }
}
