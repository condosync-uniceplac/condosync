/**
 * Rota da API: /api/enquetes/:id/voto
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { votoSchema } from '@/lib/validators';
import { votar } from '@/services/enquetesService';

// O :id da URL precisa ser um número inteiro positivo.
const idSchema = z.coerce.number().int().positive();

// PUT /api/enquetes/:id/voto  { opcaoId } — grava ou troca o voto da unidade (RN.24)
export async function PUT(request, { params }) {
  try {
    // Exige login válido (e o perfil, quando indicado); senão responde 401/403.
    const session = await requireSession();
    const id = parseWith(idSchema, (await params).id);
    await votar(session, id, parseWith(votoSchema, await readJson(request)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'enquetes/[id]/voto');
  }
}
