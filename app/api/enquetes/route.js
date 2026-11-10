import { NextResponse } from 'next/server';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { enqueteSchema } from '@/lib/validators';
import { criar, listar } from '@/services/enquetesService';

// GET /api/enquetes — enquetes com resultado parcial/final e o voto da unidade
export async function GET() {
  try {
    return NextResponse.json(await listar(await requireSession()));
  } catch (err) {
    return handleError(err, 'enquetes');
  }
}

// POST /api/enquetes  { pergunta, descricao?, encerraEm: 'AAAA-MM-DD', opcoes: [..] } — síndico
export async function POST(request) {
  try {
    const session = await requireSession();
    const dados = parseWith(enqueteSchema, await readJson(request));
    return NextResponse.json({ enquete: await criar(session, dados) }, { status: 201 });
  } catch (err) {
    return handleError(err, 'enquetes');
  }
}
