import { NextResponse } from 'next/server';
import { handleError } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { resumo } from '@/services/chamadosService';

// GET /api/chamados/resumo — quantidade de chamados não resolvidos (Visão Geral)
export async function GET() {
  try {
    return NextResponse.json(await resumo(await requireSession()));
  } catch (err) {
    return handleError(err, 'chamados/resumo');
  }
}
