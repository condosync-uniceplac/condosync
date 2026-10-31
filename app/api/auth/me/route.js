import { NextResponse } from 'next/server';
import { handleError } from '@/lib/http';
import { requireSession } from '@/lib/session';

// GET /api/auth/me — dados da sessão atual
export async function GET() {
  try {
    const s = await requireSession();
    return NextResponse.json({
      usuario: { id: s.sub, nome: s.nome, perfil: s.perfil },
      condominio: { id: s.condominioId, nome: s.condominioNome },
      unidadeId: s.unidadeId,
    });
  } catch (err) {
    return handleError(err, 'auth/me');
  }
}
