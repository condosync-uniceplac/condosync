/**
 * Rota da API: /api/condominios
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { handleError } from '@/lib/http';
import { listResumo } from '@/repositories/condominiosRepository';

// Sempre executa na hora (sem cache do Next), para devolver dados atuais.
export const dynamic = 'force-dynamic';

// GET /api/condominios — público: lista para a tela de cadastro
export async function GET() {
  try {
    const condominios = await listResumo();
    return NextResponse.json({ condominios: condominios.map((c) => ({ ...c, id: Number(c.id) })) });
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'condominios');
  }
}
