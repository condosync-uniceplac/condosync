import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, parseWith } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { GESTAO, desativarPortaria } from '@/services/moradoresService';

const idSchema = z.coerce.number().int().positive();

// DELETE /api/admin/portaria/:vinculoId — desativa a conta (porteiro desligado)
export async function DELETE(_request, { params }) {
  try {
    const session = await requireSession(GESTAO);
    await desativarPortaria(session, parseWith(idSchema, (await params).id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err, 'admin/portaria/[id]');
  }
}
