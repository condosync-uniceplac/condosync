/**
 * Rota da API: /api/auth/me
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

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
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'auth/me');
  }
}
