import { NextResponse } from 'next/server';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { reservaSchema } from '@/lib/validators';
import { criar, listar } from '@/services/reservasService';

// GET /api/reservas — espaços, reservas visíveis ao perfil e ocupação (sem dados pessoais)
export async function GET() {
  try {
    const session = await requireSession();
    return NextResponse.json(await listar(session));
  } catch (err) {
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
