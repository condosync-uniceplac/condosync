import { query } from '@/lib/db';

const pool = { query };

/** Guarda apenas o hash do token; o token em si só existe no link enviado ao usuário. */
export async function create({ usuarioId, tokenHash, expiraEm }, db = pool) {
  await db.query(
    `INSERT INTO recuperacoes_senha (usuario_id, token_hash, expira_em) VALUES ($1, $2, $3)`,
    [usuarioId, tokenHash, expiraEm],
  );
}

/** Invalida pedidos anteriores ainda não usados do mesmo usuário. */
export async function invalidarPendentes(usuarioId, db = pool) {
  await db.query(
    `UPDATE recuperacoes_senha SET usado_em = now()
      WHERE usuario_id = $1 AND usado_em IS NULL AND expira_em > now()`,
    [usuarioId],
  );
}

/** Pedido ainda válido (não usado e não expirado) para o hash do token, ou null. */
export async function findValido(tokenHash, db = pool) {
  const { rows } = await db.query(
    `SELECT id, usuario_id FROM recuperacoes_senha
      WHERE token_hash = $1 AND usado_em IS NULL AND expira_em > now()`,
    [tokenHash],
  );
  return rows[0] ?? null;
}

export async function marcarUsado(id, db = pool) {
  await db.query('UPDATE recuperacoes_senha SET usado_em = now() WHERE id = $1', [id]);
}
