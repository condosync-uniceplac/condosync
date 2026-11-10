/**
 * Rota da API: /api/admin/cadastros
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { handleError } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { listarPendentes } from '@/services/cadastrosService';

const PERFIS_GESTAO = ['SINDICO', 'ADMIN'];

// GET /api/admin/cadastros — cadastros aguardando aprovação no condomínio da sessão
export async function GET() {
  try {
    // Exige login válido (e o perfil, quando indicado); senão responde 401/403.
    const session = await requireSession(PERFIS_GESTAO);
    const cadastros = await listarPendentes(session);
    return NextResponse.json({ cadastros });
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'admin/cadastros');
  }
}
