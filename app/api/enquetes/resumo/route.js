import { NextResponse } from 'next/server';
import { handleError } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { resumo } from '@/services/enquetesService';

// GET /api/enquetes/resumo — quantidade de votações abertas (Visão Geral)
export async function GET() {
  try {
    return NextResponse.json(await resumo(await requireSession()));
  } catch (err) {
    return handleError(err, 'enquetes/resumo');
  }
}
