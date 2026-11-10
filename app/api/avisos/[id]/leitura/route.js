import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, parseWith } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { confirmarLeitura } from '@/services/avisosService';

const idSchema = z.coerce.number().int().positive();

// POST /api/avisos/:id/leitura — confirma a leitura do aviso pelo usuário logado
export async function POST(_request, { params }) {
  try {
    const session = await requireSession();
    await confirmarLeitura(session, parseWith(idSchema, (await params).id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err, 'avisos/[id]/leitura');
  }
}
