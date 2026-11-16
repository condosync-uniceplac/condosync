/**
 * Rota da API: /api/perfil
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { telefonePerfilSchema } from '@/lib/validators';
import { atualizarTelefone, obter } from '@/services/perfilService';

// GET /api/perfil — dados da própria pessoa (Meu perfil)
export async function GET() {
  try {
    // Exige login válido; cada um só vê os próprios dados.
    const session = await requireSession();
    return NextResponse.json({ perfil: await obter(session) });
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'perfil');
  }
}

// PATCH /api/perfil  { telefone } — atualiza o telefone de contato
export async function PATCH(request) {
  try {
    const session = await requireSession();
    const dados = parseWith(telefonePerfilSchema, await readJson(request));
    return NextResponse.json(await atualizarTelefone(session, dados));
  } catch (err) {
    return handleError(err, 'perfil');
  }
}
