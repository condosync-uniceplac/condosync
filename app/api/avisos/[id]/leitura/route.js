/**
 * Rota da API: /api/avisos/:id/leitura
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, parseWith } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { confirmarLeitura } from '@/services/avisosService';

// O :id da URL precisa ser um número inteiro positivo.
const idSchema = z.coerce.number().int().positive();

// POST /api/avisos/:id/leitura — confirma a leitura do aviso pelo usuário logado
export async function POST(_request, { params }) {
  try {
    // Exige login válido (e o perfil, quando indicado); senão responde 401/403.
    const session = await requireSession();
    await confirmarLeitura(session, parseWith(idSchema, (await params).id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'avisos/[id]/leitura');
  }
}
