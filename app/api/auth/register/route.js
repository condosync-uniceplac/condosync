import { NextResponse } from 'next/server';
import { clientIp, handleError, parseWith, readJson } from '@/lib/http';
import { registerSchema } from '@/lib/validators';
import { register } from '@/services/authService';

// POST /api/auth/register
export async function POST(request) {
  try {
    const data = parseWith(registerSchema, await readJson(request));
    const usuario = await register(data, { ip: clientIp(request) });
    return NextResponse.json({ usuario }, { status: 201 });
  } catch (err) {
    return handleError(err, 'auth/register');
  }
}
