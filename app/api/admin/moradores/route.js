import { NextResponse } from 'next/server';
import { handleError } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { GESTAO, listarUnidades } from '@/services/moradoresService';

// GET /api/admin/moradores — unidades do condomínio com seus moradores
export async function GET() {
  try {
    const session = await requireSession(GESTAO);
    return NextResponse.json({ unidades: await listarUnidades(session) });
  } catch (err) {
    return handleError(err, 'admin/moradores');
  }
}
