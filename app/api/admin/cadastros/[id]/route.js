import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { aprovar, recusar } from '@/services/cadastrosService';

const PERFIS_GESTAO = ['SINDICO', 'ADMIN'];
const idSchema = z.coerce.number().int().positive();
const bodySchema = z.object({ acao: z.enum(['aprovar', 'recusar'], { error: 'Ação inválida.' }) });

// POST /api/admin/cadastros/:id  { acao: 'aprovar' | 'recusar' }
export async function POST(request, { params }) {
  try {
    const session = await requireSession(PERFIS_GESTAO);
    const id = parseWith(idSchema, (await params).id);
    const { acao } = parseWith(bodySchema, await readJson(request));
    if (acao === 'aprovar') await aprovar(session, id);
    else await recusar(session, id);
    return NextResponse.json({ ok: true, acao });
  } catch (err) {
    return handleError(err, 'admin/cadastros/[id]');
  }
}
