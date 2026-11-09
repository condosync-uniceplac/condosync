import { query } from '@/lib/db';

const pool = { query };

/** Cria o visitante ou atualiza o nome se o documento já estiver cadastrado no condomínio. */
export async function upsertVisitante({ condominioId, nome, tipoDocumento, documento }, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO visitantes (condominio_id, nome, tipo_documento, documento)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (condominio_id, tipo_documento, documento) DO UPDATE SET nome = EXCLUDED.nome
     RETURNING id`,
    [condominioId, nome, tipoDocumento, documento],
  );
  return rows[0].id;
}

export async function create(v, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO visitas (visitante_id, unidade_id, autorizado_por_id, registrada_por_id,
                          placa_veiculo, previsao_entrada, status, autorizacao_via, autorizado_em)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, codigo_convite`,
    [
      v.visitanteId,
      v.unidadeId,
      v.autorizadoPorId ?? null,
      v.registradaPorId,
      v.placa ?? null,
      v.previsao,
      v.status,
      v.autorizacaoVia ?? null,
      v.autorizadoPorId ? new Date() : null,
    ],
  );
  return rows[0];
}

const SELECT = `
  SELECT vi.id, vi.unidade_id, vi.status, vi.placa_veiculo, vi.previsao_entrada, vi.entrada_em,
         vi.saida_em, vi.autorizacao_via, vi.autorizado_em, vi.codigo_convite, vi.criado_em,
         vt.nome, vt.tipo_documento, vt.documento,
         un.numero AS unidade_numero, b.nome AS bloco_nome
    FROM visitas vi
    JOIN visitantes vt ON vt.id = vi.visitante_id
    JOIN unidades un ON un.id = vi.unidade_id
    JOIN blocos b ON b.id = un.bloco_id`;

/** Visitas da unidade do morador: ativas e as das últimas 48 h. */
export async function listDaUnidade(unidadeId, db = pool) {
  const { rows } = await db.query(
    `${SELECT}
      WHERE vi.unidade_id = $1
        AND (vi.status IN ('AGUARDANDO', 'AUTORIZADO', 'PRESENTE')
             OR vi.criado_em > now() - interval '48 hours')
      ORDER BY vi.previsao_entrada DESC NULLS LAST, vi.id DESC
      LIMIT 50`,
    [unidadeId],
  );
  return rows;
}

/** Movimento da portaria: visitas ativas e as encerradas nas últimas 24 h. */
export async function listDoCondominio(condominioId, db = pool) {
  const { rows } = await db.query(
    `${SELECT}
      WHERE b.condominio_id = $1
        AND (vi.status IN ('AGUARDANDO', 'AUTORIZADO', 'PRESENTE')
             OR COALESCE(vi.saida_em, vi.cancelado_em, vi.criado_em) > now() - interval '24 hours')
      ORDER BY
        CASE vi.status WHEN 'AGUARDANDO' THEN 0 WHEN 'PRESENTE' THEN 1 WHEN 'AUTORIZADO' THEN 2 ELSE 3 END,
        vi.previsao_entrada NULLS LAST, vi.id DESC
      LIMIT 100`,
    [condominioId],
  );
  return rows;
}

export async function findById(id, condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT vi.id, vi.unidade_id, vi.status
       FROM visitas vi
       JOIN unidades un ON un.id = vi.unidade_id
       JOIN blocos b ON b.id = un.bloco_id
      WHERE vi.id = $1 AND b.condominio_id = $2`,
    [id, condominioId],
  );
  return rows[0] ?? null;
}

/**
 * Muda o status só se a visita ainda estiver no status esperado
 * (evita que duas pessoas registrem a mesma ação ao mesmo tempo).
 * Retorna false se outra pessoa já mudou a visita.
 */
export async function transicionar(id, de, para, extras = {}, db = pool) {
  const sets = ['status = $3'];
  const params = [id, de, para];
  if (extras.autorizadoPorId) {
    params.push(extras.autorizadoPorId, extras.autorizacaoVia);
    sets.push(
      `autorizado_por_id = $${params.length - 1}`,
      `autorizacao_via = $${params.length}`,
      'autorizado_em = now()',
    );
  }
  if (para === 'PRESENTE') sets.push('entrada_em = now()');
  if (para === 'FINALIZADO') sets.push('saida_em = now()');
  if (para === 'CANCELADO') sets.push('cancelado_em = now()');
  const { rowCount } = await db.query(
    `UPDATE visitas SET ${sets.join(', ')} WHERE id = $1 AND status = $2`,
    params,
  );
  return rowCount > 0;
}
