import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { votoSchema } from '@/lib/validators';
import { votar } from '@/services/enquetesService';

const idSchema = z.coerce.number().int().positive();

// PUT /api/enquetes/:id/voto  { opcaoId } — grava ou troca o voto da unidade (RN.24)
export async function PUT(request, { params }) {
  try {
    const session = await requireSession();
    const id = parseWith(idSchema, (await params).id);
    await votar(session, id, parseWith(votoSchema, await readJson(request)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err, 'enquetes/[id]/voto');
  }
}
