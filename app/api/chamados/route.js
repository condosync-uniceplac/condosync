/**
 * Rota da API: /api/chamados
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { lerFormularioChamado } from '@/lib/formChamado';
import { handleError } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { abrir, listar } from '@/services/chamadosService';

// GET /api/chamados — morador vê os próprios; portaria e síndico veem todos do condomínio
export async function GET() {
  try {
    return NextResponse.json(await listar(await requireSession()));
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'chamados');
  }
}

// POST /api/chamados (multipart) — titulo, descricao, categoriaId, urgencia, anexo?
export async function POST(request) {
  try {
    // Exige login válido (e o perfil, quando indicado); senão responde 401/403.
    const session = await requireSession();
    const { dados, arquivo } = await lerFormularioChamado(request);
    return NextResponse.json({ chamado: await abrir(session, dados, arquivo) }, { status: 201 });
  } catch (err) {
    return handleError(err, 'chamados');
  }
}
