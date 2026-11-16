/**
 * Acesso ao banco para a conta rápida de demonstração (SQL puro, parametrizado).
 */

import { query } from '@/lib/db';

// `db` pode ser o pool (padrão) ou um client dentro de withTransaction
const pool = { query };

/** Primeiro condomínio cadastrado (a demonstração usa um só). */
export async function condominioPadrao(db = pool) {
  const { rows } = await db.query('SELECT id FROM condominios ORDER BY id LIMIT 1');
  return rows[0] ? Number(rows[0].id) : null;
}

/**
 * Unidade do condomínio com menos moradores ativos (empate: sorteio), para espalhar
 * a plateia pelos apartamentos e cada um ter voto próprio nas enquetes.
 */
export async function unidadeMenosOcupada(condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT un.id
       FROM unidades un
       JOIN blocos b ON b.id = un.bloco_id
       LEFT JOIN vinculos_condominio v ON v.unidade_id = un.id AND v.ativo
      WHERE b.condominio_id = $1
      GROUP BY un.id
      ORDER BY count(v.id), random()
      LIMIT 1`,
    [condominioId],
  );
  return rows[0] ? Number(rows[0].id) : null;
}

/** Quantas contas de demonstração existem (limite de segurança). */
export async function contarContasDemo(db = pool) {
  const { rows } = await db.query('SELECT count(*)::int AS n FROM usuarios WHERE demo');
  return rows[0].n;
}

/** Cria o usuário de demonstração (dados fictícios; e-mail e CPF gerados). */
export async function criarUsuarioDemo({ nome, email, cpf, senhaHash }, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO usuarios (nome_completo, email, telefone, cpf, data_nascimento, senha_hash, demo)
     VALUES ($1, $2, '', $3, DATE '2000-01-01', $4, true)
     RETURNING id, nome_completo`,
    [nome, email, cpf, senhaHash],
  );
  return rows[0];
}
