/**
 * Rota da API: /api/reservas
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { reservaSchema } from '@/lib/validators';
import { criar, listar } from '@/services/reservasService';

// GET /api/reservas — espaços, reservas visíveis ao perfil e ocupação (sem dados pessoais)
export async function GET() {
  try {
    // Exige login válido (e o perfil, quando indicado); senão responde 401/403.
    const session = await requireSession();
    return NextResponse.json(await listar(session));
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'reservas');
  }
}

// POST /api/reservas  { espacoId, data: 'AAAA-MM-DD', turno, convidados }
export async function POST(request) {
  try {
    const session = await requireSession();
    const dados = parseWith(reservaSchema, await readJson(request));
    const reserva = await criar(session, dados);
    return NextResponse.json({ reserva }, { status: 201 });
  } catch (err) {
    return handleError(err, 'reservas');
  }
}
