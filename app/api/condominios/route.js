import { NextResponse } from 'next/server';
import { handleError } from '@/lib/http';
import { listResumo } from '@/repositories/condominiosRepository';

export const dynamic = 'force-dynamic';

// GET /api/condominios — público: lista para a tela de cadastro
export async function GET() {
  try {
    const condominios = await listResumo();
    return NextResponse.json({ condominios: condominios.map((c) => ({ ...c, id: Number(c.id) })) });
  } catch (err) {
    return handleError(err, 'condominios');
  }
}
