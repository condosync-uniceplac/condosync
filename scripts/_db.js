/* Utilitários compartilhados pelos scripts de linha de comando (migrate/seed). */
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

// Ao rodar no host (npm run db:migrate), carrega o .env se as variáveis
// ainda não vierem do ambiente (no Docker elas já vêm do compose).
if (!process.env.DATABASE_URL) {
  const envFile = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envFile) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(envFile);
  }
}

// Cria a conexão com o PostgreSQL usando DATABASE_URL (com SSL quando DB_SSL=true, caso do Supabase).
function createClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definida (veja .env.example)');
  }
  const ssl = ['true', '1'].includes(process.env.DB_SSL) ? { rejectUnauthorized: false } : false;
  return new Client({ connectionString: process.env.DATABASE_URL, ssl });
}

/**
 * Aplica, em ordem alfabética, os arquivos .sql de `dir` ainda não registrados
 * na tabela de controle `table`. Cada arquivo roda em sua própria transação,
 * então uma falha não deixa o banco pela metade e reexecutar é seguro.
 */
async function applySqlDir({ dir, table, label }) {
  const client = createClient();
  await client.connect();
  try {
    // Evita duas execuções simultâneas (ex.: dois containers subindo juntos)
    await client.query('SELECT pg_advisory_lock(hashtext($1))', [table]);
    await client.query(
      `CREATE TABLE IF NOT EXISTS ${table} (
         filename   TEXT PRIMARY KEY,
         applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`,
    );

    const { rows } = await client.query(`SELECT filename FROM ${table}`);
    const applied = new Set(rows.map((r) => r.filename));
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.info(`[${label}] já aplicado: ${file}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      console.info(`[${label}] aplicando: ${file}`);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(`INSERT INTO ${table} (filename) VALUES ($1)`, [file]);
        await client.query('COMMIT');
        count += 1;
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`[${label}] falha em ${file}: ${err.message}`);
      }
    }
    console.info(`[${label}] concluído (${count} novo(s), ${files.length - count} já aplicado(s))`);
  } finally {
    await client.query('SELECT pg_advisory_unlock(hashtext($1))', [table]).catch(() => {});
    await client.end();
  }
}

module.exports = { createClient, applySqlDir };
