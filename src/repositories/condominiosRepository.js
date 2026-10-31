import { query } from '@/lib/db';

const pool = { query };

export async function listResumo(db = pool) {
  const { rows } = await db.query('SELECT id, nome, cidade, uf FROM condominios ORDER BY nome');
  return rows;
}

export async function findById(id, db = pool) {
  const { rows } = await db.query('SELECT id, nome FROM condominios WHERE id = $1', [id]);
  return rows[0] ?? null;
}

/** Unidades do condomínio com o nome do bloco, para seleção no cadastro. */
export async function listUnidades(condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT u.id, u.numero, b.nome AS bloco
       FROM unidades u
       JOIN blocos b ON b.id = u.bloco_id
      WHERE b.condominio_id = $1
      ORDER BY b.nome, u.numero`,
    [condominioId],
  );
  return rows;
}

/** Unidade + condomínio ao qual pertence (via bloco). */
export async function findUnidade(unidadeId, db = pool) {
  const { rows } = await db.query(
    `SELECT u.id, u.numero, b.nome AS bloco, b.condominio_id
       FROM unidades u
       JOIN blocos b ON b.id = u.bloco_id
      WHERE u.id = $1`,
    [unidadeId],
  );
  return rows[0] ?? null;
}
