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
    return handleError(err, 'auth/reset-password/validate');
  }
}
