/**
 * Rota da API: /api/avisos/resumo
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { handleError } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { resumo } from '@/services/avisosService';

// GET /api/avisos/resumo — quantidade de avisos não lidos (menu e Visão Geral)
export async function GET() {
  try {
    return NextResponse.json(await resumo(await requireSession()));
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'avisos/resumo');
  }
}
