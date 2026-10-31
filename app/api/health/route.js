import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

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
    console.error('[health] falha ao conectar no banco:', err.message);
    return NextResponse.json({ status: 'error', database: 'down' }, { status: 503 });
  }
}
