/**
 * Rota da API: /api/avisos
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { lerFormularioAviso } from '@/lib/formAviso';
import { handleError, parseWith } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { listarMural, publicar } from '@/services/avisosService';

const filtroSchema = z.coerce.number().int().positive().optional();

// GET /api/avisos?categoriaId= — mural com leitura do usuário, leituras e anexos
export async function GET(request) {
  try {
    // Exige login válido (e o perfil, quando indicado); senão responde 401/403.
    const session = await requireSession();
    const param = new URL(request.url).searchParams.get('categoriaId');
    const categoriaId = parseWith(filtroSchema, param || undefined);
    return NextResponse.json(await listarMural(session, { categoriaId }));
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'avisos');
  }
}

// POST /api/avisos (multipart) — síndico publica: titulo, corpo, categoriaId, prioridade, anexo?
export async function POST(request) {
  try {
    const session = await requireSession();
    const { dados, arquivo } = await lerFormularioAviso(request);
    return NextResponse.json({ aviso: await publicar(session, dados, arquivo) }, { status: 201 });
  } catch (err) {
    return handleError(err, 'avisos');
  }
}
