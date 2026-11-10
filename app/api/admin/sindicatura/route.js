/**
 * Rota da API: /api/admin/sindicatura
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { consultar, designar, retirar } from '@/services/sindicaturaService';

const PERFIS = ['ADMIN', 'SINDICO'];
const designarSchema = z.object({
  vinculoId: z.coerce
    .number({ error: 'Escolha um morador.' })
    .int()
    .positive('Escolha um morador.'),
});

// GET /api/admin/sindicatura — síndico atual e moradores que podem assumir
export async function GET() {
  try {
    // Exige login válido (e o perfil, quando indicado); senão responde 401/403.
    const session = await requireSession(PERFIS);
    return NextResponse.json(await consultar(session));
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'admin/sindicatura');
  }
}

// POST /api/admin/sindicatura  { vinculoId } — designa (admin) ou transfere (síndico atual)
export async function POST(request) {
  try {
    const session = await requireSession(PERFIS);
    const { vinculoId } = parseWith(designarSchema, await readJson(request));
    return NextResponse.json(await designar(session, vinculoId));
  } catch (err) {
    return handleError(err, 'admin/sindicatura');
  }
}

// DELETE /api/admin/sindicatura — administrador retira a função do síndico atual
export async function DELETE() {
  try {
    const session = await requireSession(['ADMIN']);
    return NextResponse.json(await retirar(session));
  } catch (err) {
    return handleError(err, 'admin/sindicatura');
  }
}
