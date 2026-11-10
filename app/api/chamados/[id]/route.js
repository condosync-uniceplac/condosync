/**
 * Rota da API: /api/chamados/:id
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { statusChamadoSchema } from '@/lib/validators';
import { alterarStatus, detalhar } from '@/services/chamadosService';

// O :id da URL precisa ser um número inteiro positivo.
const idSchema = z.coerce.number().int().positive();

// GET /api/chamados/:id — chamado com o histórico de acompanhamento
export async function GET(_request, { params }) {
  try {
    // Exige login válido (e o perfil, quando indicado); senão responde 401/403.
    const session = await requireSession();
    return NextResponse.json(await detalhar(session, parseWith(idSchema, (await params).id)));
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'chamados/[id]');
  }
}

// PATCH /api/chamados/:id  { status, comentario? } — regra de perfil da RN.22 (bug #18)
export async function PATCH(request, { params }) {
  try {
    const session = await requireSession();
    const id = parseWith(idSchema, (await params).id);
    await alterarStatus(session, id, parseWith(statusChamadoSchema, await readJson(request)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err, 'chamados/[id]');
  }
}
