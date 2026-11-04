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
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (err) {
    return handleError(err, 'auth/login');
  }
}
