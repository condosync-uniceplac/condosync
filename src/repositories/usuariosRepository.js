import { query } from '@/lib/db';

// `db` pode ser o pool (padrão) ou um client dentro de withTransaction
const pool = { query };

const COLUNAS_PUBLICAS =
  'id, nome_completo, email, telefone, cpf, rg, data_nascimento, ativo, criado_em';

/** Busca para autenticação (inclui senha_hash — nunca devolver isso ao cliente). */
export async function findForLogin(cpf, db = pool) {
  const { rows } = await db.query(
    'SELECT id, nome_completo, email, ativo, senha_hash FROM usuarios WHERE cpf = $1',
    [cpf],
  );
  return rows[0] ?? null;
}

export async function findPublicById(id, db = pool) {
  const { rows } = await db.query('SELECT id, nome_completo, email FROM usuarios WHERE id = $1', [
    id,
  ]);
  return rows[0] ?? null;
}

export async function findByEmail(email, db = pool) {
  const { rows } = await db.query(`SELECT ${COLUNAS_PUBLICAS} FROM usuarios WHERE email = $1`, [
    email,
  ]);
  return rows[0] ?? null;
}

export async function create(u, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO usuarios (nome_completo, email, telefone, cpf, rg, data_nascimento, senha_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${COLUNAS_PUBLICAS}`,
    [u.nome, u.email, u.telefone, u.cpf, u.rg, u.dataNascimento, u.senhaHash],
  );
  return rows[0];
}
