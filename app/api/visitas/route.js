import { NextResponse } from 'next/server';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { preAutorizacaoSchema, visitaNaoPrevistaSchema } from '@/lib/validators';
import { listar, preAutorizar, registrarNaoPrevisto } from '@/services/visitasService';

// GET /api/visitas — morador: visitas da sua unidade; portaria/síndico: movimento do condomínio
export async function GET() {
  try {
    const session = await requireSession();
    return NextResponse.json(await listar(session));
  } catch (err) {
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
