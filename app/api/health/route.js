/**
 * Rota da API: /api/health
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Sempre executa na hora (sem cache do Next), para devolver dados atuais.
export const dynamic = 'force-dynamic';

// GET /api/health — usado pelo HEALTHCHECK do Docker e por monitoramento
export async function GET() {
  const startedAt = Date.now();
  try {
    await query('SELECT 1');
    return NextResponse.json({
      status: 'ok',
      database: 'up',
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    console.error('[health] falha ao conectar no banco:', err.message);
    return NextResponse.json({ status: 'error', database: 'down' }, { status: 503 });
  }
}
