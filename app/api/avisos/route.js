import { NextResponse } from 'next/server';
import { z } from 'zod';
import { lerFormularioAviso } from '@/lib/formAviso';
import { handleError, parseWith } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { listarMural, publicar } from '@/services/avisosService';

const filtroSchema = z.coerce.number().int().positive().optional();

// GET /api/avisos?categoriaId= — mural com leitura do usuário, leituras e anexos
export async function GET(request) {
  try {
    const session = await requireSession();
    const param = new URL(request.url).searchParams.get('categoriaId');
    const categoriaId = parseWith(filtroSchema, param || undefined);
    return NextResponse.json(await listarMural(session, { categoriaId }));
  } catch (err) {
    return handleError(err, 'avisos');
  }
}

// POST /api/avisos (multipart) — síndico publica: titulo, corpo, categoriaId, prioridade, anexo?
export async function POST(request) {
  try {
    const session = await requireSession();
    const { dados, arquivo } = await lerFormularioAviso(request);
    return NextResponse.json({ aviso: await publicar(session, dados, arquivo) }, { status: 201 });
  } catch (err) {
    return handleError(err, 'avisos');
  }
}
