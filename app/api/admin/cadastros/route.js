import { NextResponse } from 'next/server';
import { handleError } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { listarPendentes } from '@/services/cadastrosService';

const PERFIS_GESTAO = ['SINDICO', 'ADMIN'];

// GET /api/admin/cadastros — cadastros aguardando aprovação no condomínio da sessão
export async function GET() {
  try {
    const session = await requireSession(PERFIS_GESTAO);
    const cadastros = await listarPendentes(session);
    return NextResponse.json({ cadastros });
  } catch (err) {
    return handleError(err, 'admin/cadastros');
  }
}
