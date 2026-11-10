import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { comentarioChamadoSchema } from '@/lib/validators';
import { comentar } from '@/services/chamadosService';

const idSchema = z.coerce.number().int().positive();

// POST /api/chamados/:id/acompanhamentos  { comentario } — portaria e síndico
export async function POST(request, { params }) {
  try {
    const session = await requireSession();
    const id = parseWith(idSchema, (await params).id);
    await comentar(session, id, parseWith(comentarioChamadoSchema, await readJson(request)));
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return handleError(err, 'chamados/[id]/acompanhamentos');
  }
}
