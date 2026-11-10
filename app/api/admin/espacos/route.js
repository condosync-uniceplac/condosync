import { NextResponse } from 'next/server';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { espacoSchema } from '@/lib/validators';
import { GESTAO, criar, listar } from '@/services/espacosService';

// GET /api/admin/espacos — todos os espaços (inclusive desativados)
export async function GET() {
  try {
    const session = await requireSession(GESTAO);
    return NextResponse.json({ espacos: await listar(session) });
  } catch (err) {
    return handleError(err, 'admin/espacos');
  }
}

// POST /api/admin/espacos  { nome, descricao?, capacidade, valor }
export async function POST(request) {
  try {
    const session = await requireSession(GESTAO);
    const dados = parseWith(espacoSchema, await readJson(request));
    return NextResponse.json({ espaco: await criar(session, dados) }, { status: 201 });
  } catch (err) {
    return handleError(err, 'admin/espacos');
  }
}
