/**
 * Consultas SQL dos Termos de Uso / Política de Privacidade e dos aceites.
 * Camada de dados (repository): só executa SQL, sem regras de negócio.
 * O último parâmetro `db` permite rodar a consulta dentro de uma transação (withTransaction).
 */

import { query } from '@/lib/db';

// Padrão: usa o pool de conexões; numa transação, recebe o client da transação.
const pool = { query };

/** Versão vigente (mais recente já em vigor) de cada tipo de termo. */
export async function listVigentes(db = pool) {
  const { rows } = await db.query(
    `SELECT DISTINCT ON (tipo) id, tipo, versao
       FROM termos_documentos
      WHERE vigente_desde <= now()
      ORDER BY tipo, vigente_desde DESC`,
  );
  return rows;
}

// Registra que o usuário aceitou cada termo (unnest transforma a lista em linhas).
export async function registrarAceites(usuarioId, termoIds, ip, db = pool) {
  await db.query(
    `INSERT INTO aceites_termos (usuario_id, termo_id, ip)
     SELECT $1, termo_id, $3::inet FROM unnest($2::bigint[]) AS termo_id
     ON CONFLICT (usuario_id, termo_id) DO NOTHING`,
    [usuarioId, termoIds, ip],
  );
}
