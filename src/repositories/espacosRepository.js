import { query } from '@/lib/db';

const pool = { query };

/** Todos os espaços do condomínio (inclusive desativados), com as reservas futuras ativas. */
export async function listTodos(condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT e.id, e.nome, e.descricao, e.capacidade_pessoas, e.valor, e.ativo,
            (SELECT count(*) FROM reservas r
              WHERE r.espaco_id = e.id AND r.status IN ('PENDENTE', 'CONFIRMADA') AND r.fim > now()
            )::int AS reservas_futuras
       FROM espacos e
      WHERE e.condominio_id = $1
      ORDER BY e.ativo DESC, e.nome`,
    [condominioId],
  );
  return rows;
}

export async function findById(id, condominioId, db = pool) {
  const { rows } = await db.query(
    'SELECT id, nome, ativo FROM espacos WHERE id = $1 AND condominio_id = $2',
    [id, condominioId],
  );
  return rows[0] ?? null;
}

/** Outro espaço do condomínio com o mesmo nome (sem diferenciar maiúsculas). */
export async function existeNome(condominioId, nome, ignorarId = null, db = pool) {
  const { rows } = await db.query(
    `SELECT 1 FROM espacos
      WHERE condominio_id = $1 AND lower(nome) = lower($2) AND ($3::bigint IS NULL OR id <> $3)
      LIMIT 1`,
    [condominioId, nome, ignorarId],
  );
  return rows.length > 0;
}

export async function create(condominioId, e, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO espacos (condominio_id, nome, descricao, capacidade_pessoas, valor)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [condominioId, e.nome, e.descricao ?? null, e.capacidade, e.valor],
  );
  return rows[0];
}

export async function update(id, e, db = pool) {
  await db.query(
    `UPDATE espacos
        SET nome = $2, descricao = $3, capacidade_pessoas = $4, valor = $5, ativo = $6
      WHERE id = $1`,
    [id, e.nome, e.descricao ?? null, e.capacidade, e.valor, e.ativo],
  );
}
