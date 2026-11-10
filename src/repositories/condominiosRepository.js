/**
 * Consultas SQL de condomínios, blocos e unidades.
 * Camada de dados (repository): só executa SQL, sem regras de negócio.
 * O último parâmetro `db` permite rodar a consulta dentro de uma transação (withTransaction).
 */

import { query } from '@/lib/db';

// Padrão: usa o pool de conexões; numa transação, recebe o client da transação.
const pool = { query };

// Lista de condomínios para o formulário de cadastro.
export async function listResumo(db = pool) {
  const { rows } = await db.query('SELECT id, nome, cidade, uf FROM condominios ORDER BY nome');
  return rows;
}

// Condomínio pelo id (ou null).
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

/** Nome, quantidade de unidades e blocos do condomínio (cartão do menu lateral). */
export async function findResumo(condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT c.nome,
            (SELECT count(*)::int FROM unidades u JOIN blocos b ON b.id = u.bloco_id
              WHERE b.condominio_id = c.id) AS unidades,
            COALESCE((SELECT array_agg(b.nome ORDER BY b.nome) FROM blocos b
                       WHERE b.condominio_id = c.id), '{}') AS blocos
       FROM condominios c WHERE c.id = $1`,
    [condominioId],
  );
  return rows[0] ?? null;
}
