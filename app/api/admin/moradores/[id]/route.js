/**
 * Rota da API: /api/admin/moradores/:id
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { GESTAO, moverDeUnidade, removerMorador } from '@/services/moradoresService';

// O :id da URL precisa ser um número inteiro positivo.
const idSchema = z.coerce.number().int().positive();
const moverSchema = z.object({
  unidadeId: z.coerce.number({ error: 'Escolha a unidade.' }).int().positive('Escolha a unidade.'),
});

// PATCH /api/admin/moradores/:vinculoId  { unidadeId } — troca o morador de unidade
export async function PATCH(request, { params }) {
  try {
    // Exige login válido (e o perfil, quando indicado); senão responde 401/403.
    const session = await requireSession(GESTAO);
    const id = parseWith(idSchema, (await params).id);
    const { unidadeId } = parseWith(moverSchema, await readJson(request));
    await moverDeUnidade(session, id, unidadeId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'admin/moradores/[id]');
  }
}

// DELETE /api/admin/moradores/:vinculoId — encerra o vínculo de quem saiu do condomínio
export async function DELETE(_request, { params }) {
  try {
    const session = await requireSession(GESTAO);
    await removerMorador(session, parseWith(idSchema, (await params).id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err, 'admin/moradores/[id]');
  }
}
