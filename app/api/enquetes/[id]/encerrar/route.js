import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, parseWith } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { encerrar } from '@/services/enquetesService';

const idSchema = z.coerce.number().int().positive();

// POST /api/enquetes/:id/encerrar — síndico encerra a votação antes do prazo
export async function POST(_request, { params }) {
  try {
    const session = await requireSession();
    await encerrar(session, parseWith(idSchema, (await params).id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err, 'enquetes/[id]/encerrar');
  }
}
