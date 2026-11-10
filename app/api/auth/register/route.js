/**
 * Rota da API: /api/auth/register
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

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
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'auth/register');
  }
}
