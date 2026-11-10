/**
 * Rota da API: /api/admin/moradores
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { handleError } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { GESTAO, listarUnidades } from '@/services/moradoresService';

// GET /api/admin/moradores — unidades do condomínio com seus moradores
export async function GET() {
  try {
    // Exige login válido (e o perfil, quando indicado); senão responde 401/403.
    const session = await requireSession(GESTAO);
    return NextResponse.json({ unidades: await listarUnidades(session) });
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'admin/moradores');
  }
}
