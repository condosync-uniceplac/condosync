import { query } from '@/lib/db';

const pool = { query };
const ATIVAS = `r.status IN ('PENDENTE', 'CONFIRMADA')`;

export async function listEspacos(condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT id, nome, descricao, capacidade_pessoas, valor
       FROM espacos
      WHERE condominio_id = $1 AND ativo
      ORDER BY nome`,
    [condominioId],
  );
  return rows;
}

/** Espaço do condomínio, travado até o fim da transação (serializa reservas do mesmo espaço). */
export async function findEspacoParaReserva(espacoId, condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT id, nome, capacidade_pessoas, valor
       FROM espacos
      WHERE id = $1 AND condominio_id = $2 AND ativo
      FOR UPDATE`,
    [espacoId, condominioId],
  );
  return rows[0] ?? null;
}

/** Trava as reservas do morador até o fim da transação (evita duas reservas simultâneas). */
export async function travarMorador(vinculoId, db = pool) {
  await db.query(`SELECT pg_advisory_xact_lock(hashtext('reserva-vinculo'), $1::int)`, [
    Number(vinculoId),
  ]);
}

export async function existeConflitoEspaco(espacoId, inicio, fim, db = pool) {
  const { rows } = await db.query(
    `SELECT 1 FROM reservas r
      WHERE r.espaco_id = $1 AND ${ATIVAS} AND r.inicio < $3 AND $2 < r.fim
      LIMIT 1`,
    [espacoId, inicio, fim],
  );
  return rows.length > 0;
}

export async function existeConflitoMorador(vinculoId, inicio, fim, db = pool) {
  const { rows } = await db.query(
    `SELECT 1 FROM reservas r
      WHERE r.vinculo_id = $1 AND ${ATIVAS} AND r.inicio < $3 AND $2 < r.fim
      LIMIT 1`,
    [vinculoId, inicio, fim],
  );
  return rows.length > 0;
}

export async function create({ espacoId, vinculoId, inicio, fim, convidados, valor }, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO reservas (espaco_id, vinculo_id, inicio, fim, status, valor_cobrado, convidados)
     VALUES ($1, $2, $3, $4, 'CONFIRMADA', $5, $6)
     RETURNING id`,
    [espacoId, vinculoId, inicio, fim, valor, convidados],
  );
  return rows[0];
}

/**
 * Reservas ativas que ainda não terminaram, no condomínio.
 * Com `vinculoId`, só as daquele morador.
 */
export async function listAtivas(condominioId, { vinculoId } = {}, db = pool) {
  const { rows } = await db.query(
    `SELECT r.id, r.espaco_id, r.vinculo_id, r.inicio, r.fim, r.status, r.convidados,
            r.valor_cobrado, e.nome AS espaco_nome,
            u.nome_completo AS responsavel, un.numero AS unidade_numero, b.nome AS bloco_nome
       FROM reservas r
       JOIN espacos e ON e.id = r.espaco_id
       JOIN vinculos_condominio v ON v.id = r.vinculo_id
       JOIN usuarios u ON u.id = v.usuario_id
       LEFT JOIN unidades un ON un.id = v.unidade_id
       LEFT JOIN blocos b ON b.id = un.bloco_id
      WHERE e.condominio_id = $1 AND ${ATIVAS} AND r.fim > now()
        AND ($2::bigint IS NULL OR r.vinculo_id = $2)
      ORDER BY r.inicio`,
    [condominioId, vinculoId ?? null],
  );
  return rows;
}

/** Ocupação dos espaços (sem dados pessoais), para a tela marcar turnos indisponíveis. */
export async function listOcupacao(condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT r.espaco_id, r.inicio, r.fim
       FROM reservas r
       JOIN espacos e ON e.id = r.espaco_id
      WHERE e.condominio_id = $1 AND ${ATIVAS} AND r.fim > now()`,
    [condominioId],
  );
  return rows;
}

export async function findById(id, condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT r.id, r.vinculo_id, r.inicio, r.status
       FROM reservas r
       JOIN espacos e ON e.id = r.espaco_id
      WHERE r.id = $1 AND e.condominio_id = $2`,
    [id, condominioId],
  );
  return rows[0] ?? null;
}

export async function cancelar(id, db = pool) {
  await db.query(
    `UPDATE reservas SET status = 'CANCELADA', cancelada_em = now()
      WHERE id = $1 AND status IN ('PENDENTE', 'CONFIRMADA')`,
    [id],
  );
}
