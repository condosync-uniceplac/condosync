import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, parseWith } from '@/lib/http';
import { listUnidades } from '@/repositories/condominiosRepository';

const paramsSchema = z.object({ id: z.coerce.number().int().positive() });

// GET /api/condominios/:id/unidades — público: unidades para a tela de cadastro
export async function GET(_request, { params }) {
  try {
    const { id } = parseWith(paramsSchema, await params);
    const unidades = await listUnidades(id);
    return NextResponse.json({ unidades: unidades.map((u) => ({ ...u, id: Number(u.id) })) });
  } catch (err) {
    return handleError(err, 'condominios/unidades');
  }
}
