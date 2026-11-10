/**
 * Rota da API: /api/visitas/:id
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { acaoVisitaSchema } from '@/lib/validators';
import { executarAcao } from '@/services/visitasService';

// O :id da URL precisa ser um número inteiro positivo.
const idSchema = z.coerce.number().int().positive();

// PATCH /api/visitas/:id  { acao: AUTORIZAR | RECUSAR | CANCELAR | ENTRADA | SAIDA }
export async function PATCH(request, { params }) {
  try {
    // Exige login válido (e o perfil, quando indicado); senão responde 401/403.
    const session = await requireSession();
    const id = parseWith(idSchema, (await params).id);
    const { acao } = parseWith(acaoVisitaSchema, await readJson(request));
    return NextResponse.json(await executarAcao(session, id, acao));
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'visitas/[id]');
  }
}
