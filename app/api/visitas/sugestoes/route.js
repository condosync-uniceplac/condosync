/**
 * Rota da API: /api/visitas/sugestoes
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { handleError } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { sugerirVisitantes } from '@/services/visitasService';

// GET /api/visitas/sugestoes?busca=ana — visitantes já cadastrados para preencher o formulário
export async function GET(request) {
  try {
    // Exige login válido; o service filtra o que cada perfil pode ver.
    const session = await requireSession();
    const busca = new URL(request.url).searchParams.get('busca');
    return NextResponse.json({ visitantes: await sugerirVisitantes(session, busca) });
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'visitas/sugestoes');
  }
}
