import { NextResponse } from 'next/server';
import { z } from 'zod';
import { lerFormularioAviso } from '@/lib/formAviso';
import { handleError, parseWith } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { editar, remover } from '@/services/avisosService';

const idSchema = z.coerce.number().int().positive();

// PUT /api/avisos/:id (multipart) — síndico edita; anexo novo substitui, removerAnexo=true remove
export async function PUT(request, { params }) {
  try {
    const session = await requireSession();
    const id = parseWith(idSchema, (await params).id);
    const { dados, arquivo, removerAnexo } = await lerFormularioAviso(request);
    await editar(session, id, dados, arquivo, { removerAnexo });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err, 'avisos/[id]');
  }
}

// DELETE /api/avisos/:id — síndico remove o aviso (com anexos e leituras)
export async function DELETE(_request, { params }) {
  try {
    const session = await requireSession();
    await remover(session, parseWith(idSchema, (await params).id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err, 'avisos/[id]');
  }
}
