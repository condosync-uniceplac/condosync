import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { espacoSchema } from '@/lib/validators';
import { GESTAO, editar } from '@/services/espacosService';

const idSchema = z.coerce.number().int().positive();

// PUT /api/admin/espacos/:id  { nome, descricao?, capacidade, valor, ativo }
export async function PUT(request, { params }) {
  try {
    const session = await requireSession(GESTAO);
    const id = parseWith(idSchema, (await params).id);
    await editar(session, id, parseWith(espacoSchema, await readJson(request)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err, 'admin/espacos/[id]');
  }
}
