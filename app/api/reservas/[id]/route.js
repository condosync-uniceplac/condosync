import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, parseWith } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { cancelar } from '@/services/reservasService';

const idSchema = z.coerce.number().int().positive();

// DELETE /api/reservas/:id — cancela a reserva (o registro fica com status CANCELADA)
export async function DELETE(_request, { params }) {
  try {
    const session = await requireSession();
    const id = parseWith(idSchema, (await params).id);
    await cancelar(session, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err, 'reservas/[id]');
  }
}
