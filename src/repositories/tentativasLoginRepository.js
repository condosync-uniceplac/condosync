/**
 * Consultas SQL das falhas de login, usadas no bloqueio de 15 minutos após 5 tentativas.
 * Camada de dados (repository): só executa SQL, sem regras de negócio.
 * O último parâmetro `db` permite rodar a consulta dentro de uma transação (withTransaction).
 */

import { query } from '@/lib/db';

// Padrão: usa o pool de conexões; numa transação, recebe o client da transação.
const pool = { query };

/** Quantidade de falhas de login do identificador nos últimos `minutos`. */
export async function contarFalhasRecentes(identificador, minutos, db = pool) {
  const { rows } = await db.query(
    `SELECT count(*)::int AS total
       FROM tentativas_login
      WHERE identificador = $1
        AND criado_em > now() - make_interval(mins => $2)`,
    [identificador, minutos],
  );
  return rows[0]?.total ?? 0;
}

// Registra uma tentativa de login que falhou.
export async function registrarFalha(identificador, ip, db = pool) {
  await db.query('INSERT INTO tentativas_login (identificador, ip) VALUES ($1, $2)', [
    identificador,
    ip ?? null,
  ]);
}

/** Login bem-sucedido zera o contador do identificador. */
export async function limpar(identificador, db = pool) {
  await db.query('DELETE FROM tentativas_login WHERE identificador = $1', [identificador]);
}
