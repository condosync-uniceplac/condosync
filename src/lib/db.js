import { Pool } from 'pg';
import { getEnv } from './env';

/**
 * Pool de conexões singleton.
 * Em dev o Next.js recarrega módulos a cada alteração (HMR); guardar o pool em
 * globalThis evita abrir um novo pool (e estourar conexões) a cada reload.
 */
function createPool() {
  const { DATABASE_URL, DB_SSL } = getEnv();
  const pool = new Pool({
    connectionString: DATABASE_URL,
    // Supabase exige SSL; o certificado do pooler não é de uma CA pública conhecida
    ssl: DB_SSL ? { rejectUnauthorized: false } : false,
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  pool.on('error', (err) => {
    console.error('[db] erro inesperado em cliente ocioso:', err.message);
  });
  return pool;
}

export function getPool() {
  if (!globalThis.__condosyncPool) {
    globalThis.__condosyncPool = createPool();
  }
  return globalThis.__condosyncPool;
}

/** Executa uma query parametrizada. Sempre use $1, $2... — nunca concatene valores. */
export function query(text, params = []) {
  return getPool().query(text, params);
}

/** Executa `fn(client)` dentro de uma transação (BEGIN/COMMIT/ROLLBACK). */
export async function withTransaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
