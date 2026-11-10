/**
 * Consultas SQL de usuários (tabela usuarios).
 * Camada de dados (repository): só executa SQL, sem regras de negócio.
 * O último parâmetro `db` permite rodar a consulta dentro de uma transação (withTransaction).
 */

import { query } from '@/lib/db';

// `db` pode ser o pool (padrão) ou um client dentro de withTransaction
const pool = { query };

// Colunas que podem sair para a tela (sem o hash da senha).
const COLUNAS_PUBLICAS =
  'id, nome_completo, email, telefone, cpf, data_nascimento, ativo, criado_em';

/** Busca para autenticação (inclui senha_hash — nunca devolver isso ao cliente). */
/** Busca para login por e-mail ou CPF (`tipo` vem do loginSchema). */
export async function findForLogin({ tipo, valor }, db = pool) {
  const coluna = tipo === 'email' ? 'email' : 'cpf';
  const { rows } = await db.query(
    `SELECT id, nome_completo, email, ativo, senha_hash FROM usuarios WHERE ${coluna} = $1`,
    [valor],
  );
  return rows[0] ?? null;
}

// Dados públicos do usuário pelo id.
export async function findPublicById(id, db = pool) {
  const { rows } = await db.query('SELECT id, nome_completo, email FROM usuarios WHERE id = $1', [
    id,
  ]);
  return rows[0] ?? null;
}

// Usuário pelo e-mail (usado na recuperação de senha).
export async function findByEmail(email, db = pool) {
  const { rows } = await db.query(`SELECT ${COLUNAS_PUBLICAS} FROM usuarios WHERE email = $1`, [
    email,
  ]);
  return rows[0] ?? null;
}

// Insere o usuário e devolve as colunas públicas.
export async function create(u, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO usuarios (nome_completo, email, telefone, cpf, data_nascimento, senha_hash)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${COLUNAS_PUBLICAS}`,
    [u.nome, u.email, u.telefone, u.cpf, u.dataNascimento, u.senhaHash],
  );
  return rows[0];
}

// Troca o hash da senha.
export async function atualizarSenha(id, senhaHash, db = pool) {
  await db.query('UPDATE usuarios SET senha_hash = $2, atualizado_em = now() WHERE id = $1', [
    id,
    senhaHash,
  ]);
}

/** Hash da senha atual (uso interno do servidor — nunca devolver ao cliente). */
export async function findSenhaHash(id, db = pool) {
  const { rows } = await db.query('SELECT senha_hash FROM usuarios WHERE id = $1', [id]);
  return rows[0]?.senha_hash ?? null;
}
