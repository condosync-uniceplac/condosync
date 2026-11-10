/**
 * Rota da API: /api/enquetes
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { enqueteSchema } from '@/lib/validators';
import { criar, listar } from '@/services/enquetesService';

// GET /api/enquetes — enquetes com resultado parcial/final e o voto da unidade
export async function GET() {
  try {
    return NextResponse.json(await listar(await requireSession()));
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'enquetes');
  }
}

// POST /api/enquetes  { pergunta, descricao?, encerraEm: 'AAAA-MM-DD', opcoes: [..] } — síndico
export async function POST(request) {
  try {
    // Exige login válido (e o perfil, quando indicado); senão responde 401/403.
    const session = await requireSession();
    const dados = parseWith(enqueteSchema, await readJson(request));
    return NextResponse.json({ enquete: await criar(session, dados) }, { status: 201 });
  } catch (err) {
    return handleError(err, 'enquetes');
  }
}
