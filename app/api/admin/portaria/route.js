/**
 * Rota da API: /api/admin/portaria
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { contaPortariaSchema } from '@/lib/validators';
import { GESTAO, criarPortaria, listarPortaria } from '@/services/moradoresService';

// GET /api/admin/portaria — contas ativas da portaria
export async function GET() {
  try {
    // Exige login válido (e o perfil, quando indicado); senão responde 401/403.
    const session = await requireSession(GESTAO);
    return NextResponse.json({ contas: await listarPortaria(session) });
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'admin/portaria');
  }
}

// POST /api/admin/portaria — cria a conta e envia o convite para definir a senha
export async function POST(request) {
  try {
    const session = await requireSession(GESTAO);
    const dados = parseWith(contaPortariaSchema, await readJson(request));
    return NextResponse.json({ conta: await criarPortaria(session, dados) }, { status: 201 });
  } catch (err) {
    return handleError(err, 'admin/portaria');
  }
}
