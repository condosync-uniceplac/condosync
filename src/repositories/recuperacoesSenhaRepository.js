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
