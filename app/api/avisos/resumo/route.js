import { NextResponse } from 'next/server';
import { handleError } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { resumo } from '@/services/avisosService';

// GET /api/avisos/resumo — quantidade de avisos não lidos (menu e Visão Geral)
export async function GET() {
  try {
    return NextResponse.json(await resumo(await requireSession()));
  } catch (err) {
    return handleError(err, 'avisos/resumo');
  }
}
