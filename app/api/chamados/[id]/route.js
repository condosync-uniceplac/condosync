import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { statusChamadoSchema } from '@/lib/validators';
import { alterarStatus, detalhar } from '@/services/chamadosService';

const idSchema = z.coerce.number().int().positive();

// GET /api/chamados/:id — chamado com o histórico de acompanhamento
export async function GET(_request, { params }) {
  try {
    const session = await requireSession();
    return NextResponse.json(await detalhar(session, parseWith(idSchema, (await params).id)));
  } catch (err) {
    return handleError(err, 'chamados/[id]');
  }
}

// PATCH /api/chamados/:id  { status, comentario? } — regra de perfil da RN.22 (bug #18)
export async function PATCH(request, { params }) {
  try {
    const session = await requireSession();
    const id = parseWith(idSchema, (await params).id);
    await alterarStatus(session, id, parseWith(statusChamadoSchema, await readJson(request)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err, 'chamados/[id]');
  }
}
