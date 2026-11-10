import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { GESTAO, moverDeUnidade, removerMorador } from '@/services/moradoresService';

const idSchema = z.coerce.number().int().positive();
const moverSchema = z.object({
  unidadeId: z.coerce.number({ error: 'Escolha a unidade.' }).int().positive('Escolha a unidade.'),
});

// PATCH /api/admin/moradores/:vinculoId  { unidadeId } — troca o morador de unidade
export async function PATCH(request, { params }) {
  try {
    const session = await requireSession(GESTAO);
    const id = parseWith(idSchema, (await params).id);
    const { unidadeId } = parseWith(moverSchema, await readJson(request));
    await moverDeUnidade(session, id, unidadeId);
    return NextResponse.json({ ok: true });
  } catch (err) {
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
