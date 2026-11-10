/**
 * Rota da API: /api/visitas
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { preAutorizacaoSchema, visitaNaoPrevistaSchema } from '@/lib/validators';
import { listar, preAutorizar, registrarNaoPrevisto } from '@/services/visitasService';

// GET /api/visitas — morador: visitas da sua unidade; portaria/síndico: movimento do condomínio
export async function GET() {
  try {
    // Exige login válido (e o perfil, quando indicado); senão responde 401/403.
    const session = await requireSession();
    return NextResponse.json(await listar(session));
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'visitas');
  }
}

// POST /api/visitas — morador pré-autoriza; portaria registra visitante não previsto
export async function POST(request) {
  try {
    const session = await requireSession();
    const corpo = await readJson(request);
    const visita =
      session.perfil === 'MORADOR'
        ? await preAutorizar(session, parseWith(preAutorizacaoSchema, corpo))
        : await registrarNaoPrevisto(session, parseWith(visitaNaoPrevistaSchema, corpo));
    return NextResponse.json({ visita }, { status: 201 });
  } catch (err) {
    return handleError(err, 'visitas');
  }
}
