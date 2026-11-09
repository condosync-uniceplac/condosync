import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { acaoVisitaSchema } from '@/lib/validators';
import { executarAcao } from '@/services/visitasService';

const idSchema = z.coerce.number().int().positive();

// PATCH /api/visitas/:id  { acao: AUTORIZAR | RECUSAR | CANCELAR | ENTRADA | SAIDA }
export async function PATCH(request, { params }) {
  try {
    const session = await requireSession();
    const id = parseWith(idSchema, (await params).id);
    const { acao } = parseWith(acaoVisitaSchema, await readJson(request));
    return NextResponse.json(await executarAcao(session, id, acao));
  } catch (err) {
    return handleError(err, 'visitas/[id]');
  }
}
