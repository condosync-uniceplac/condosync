/**
 * Rota da API: /api/chamados/:id/acompanhamentos
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { comentarioChamadoSchema } from '@/lib/validators';
import { comentar } from '@/services/chamadosService';

// O :id da URL precisa ser um número inteiro positivo.
const idSchema = z.coerce.number().int().positive();

// POST /api/chamados/:id/acompanhamentos  { comentario } — portaria e síndico
export async function POST(request, { params }) {
  try {
    // Exige login válido (e o perfil, quando indicado); senão responde 401/403.
    const session = await requireSession();
    const id = parseWith(idSchema, (await params).id);
    await comentar(session, id, parseWith(comentarioChamadoSchema, await readJson(request)));
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'chamados/[id]/acompanhamentos');
  }
}
