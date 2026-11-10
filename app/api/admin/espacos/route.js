/**
 * Rota da API: /api/admin/espacos
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { espacoSchema } from '@/lib/validators';
import { GESTAO, criar, listar } from '@/services/espacosService';

// GET /api/admin/espacos — todos os espaços (inclusive desativados)
export async function GET() {
  try {
    // Exige login válido (e o perfil, quando indicado); senão responde 401/403.
    const session = await requireSession(GESTAO);
    return NextResponse.json({ espacos: await listar(session) });
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'admin/espacos');
  }
}

// POST /api/admin/espacos  { nome, descricao?, capacidade, valor }
export async function POST(request) {
  try {
    const session = await requireSession(GESTAO);
    const dados = parseWith(espacoSchema, await readJson(request));
    return NextResponse.json({ espaco: await criar(session, dados) }, { status: 201 });
  } catch (err) {
    return handleError(err, 'admin/espacos');
  }
}
