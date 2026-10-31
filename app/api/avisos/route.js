import { NextResponse } from 'next/server';
import { handleError } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { listarMural } from '@/services/avisosService';

// GET /api/avisos — exemplo de módulo completo (rota -> service -> repository)
export async function GET() {
  try {
    const session = await requireSession();
    const avisos = await listarMural(session);
    return NextResponse.json({ avisos });
  } catch (err) {
    return handleError(err, 'avisos');
  }
}
