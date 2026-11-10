import { query } from '@/lib/db';

const pool = { query };

/**
 * Enquetes do condomínio com as opções e a contagem de votos.
 * `meu_voto` é a opção escolhida pela unidade informada (RN.24: um voto por unidade)
 * e `votado_por` quem registrou esse voto.
 */
export async function listByCondominio(condominioId, unidadeId, db = pool) {
  const { rows } = await db.query(
    `SELECT e.id, e.pergunta, e.descricao, e.abre_em, e.encerra_em, e.criado_em,
            e.encerrada_por IS NOT NULL AS encerrada_antes,
            (e.encerra_em <= now()) AS encerrada,
            u.nome_completo AS criador,
            mv.opcao_id AS meu_voto, uv.nome_completo AS votado_por, mv.usuario_id AS votado_por_id,
            (SELECT count(*)::int FROM votos_enquete x WHERE x.enquete_id = e.id) AS total,
            (SELECT json_agg(json_build_object(
                      'id', o.id, 'texto', o.texto,
                      'votos', (SELECT count(*)::int FROM votos_enquete x WHERE x.opcao_id = o.id))
                    ORDER BY o.ordem)
               FROM enquete_opcoes o WHERE o.enquete_id = e.id) AS opcoes
       FROM enquetes e
       JOIN vinculos_condominio v ON v.id = e.criador_id
       JOIN usuarios u ON u.id = v.usuario_id
       LEFT JOIN votos_enquete mv ON mv.enquete_id = e.id AND mv.unidade_id = $2
       LEFT JOIN usuarios uv ON uv.id = mv.usuario_id
      WHERE e.condominio_id = $1
      ORDER BY (e.encerra_em <= now()), 
               CASE WHEN e.encerra_em > now() THEN e.encerra_em END ASC,
               e.encerra_em DESC`,
    [condominioId, unidadeId ?? null],
  );
  return rows;
}

export async function create(e, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO enquetes (condominio_id, criador_id, pergunta, descricao, encerra_em)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [e.condominioId, e.criadorId, e.pergunta, e.descricao ?? null, e.encerraEm],
  );
  return rows[0];
}

export async function addOpcoes(enqueteId, textos, db = pool) {
  await db.query(
    `INSERT INTO enquete_opcoes (enquete_id, texto, ordem)
     SELECT $1, t, o FROM unnest($2::text[]) WITH ORDINALITY AS x (t, o)`,
    [enqueteId, textos],
  );
}

/** Enquete do condomínio, bloqueada para leitura enquanto o voto é gravado. */
export async function lockAberta(id, condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT id, (encerra_em <= now()) AS encerrada
       FROM enquetes WHERE id = $1 AND condominio_id = $2 FOR SHARE`,
    [id, condominioId],
  );
  return rows[0] ?? null;
}

export async function opcaoDaEnquete(enqueteId, opcaoId, db = pool) {
  const { rowCount } = await db.query(
    'SELECT 1 FROM enquete_opcoes WHERE id = $1 AND enquete_id = $2',
    [opcaoId, enqueteId],
  );
  return rowCount > 0;
}

/** Grava ou troca o voto da unidade (o último a votar na unidade prevalece). */
export async function votar({ enqueteId, unidadeId, usuarioId, opcaoId }, db = pool) {
  await db.query(
    `INSERT INTO votos_enquete (enquete_id, unidade_id, usuario_id, opcao_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (enquete_id, unidade_id)
     DO UPDATE SET opcao_id = EXCLUDED.opcao_id, usuario_id = EXCLUDED.usuario_id,
                   atualizado_em = now()`,
    [enqueteId, unidadeId, usuarioId, opcaoId],
  );
}

/** Encerra agora; só muda se ainda estiver aberta. Retorna false se já estava encerrada. */
export async function encerrar(id, condominioId, vinculoId, db = pool) {
  const { rowCount } = await db.query(
    `UPDATE enquetes SET encerra_em = GREATEST(now(), abre_em + interval '1 second'),
                         encerrada_por = $3
      WHERE id = $1 AND condominio_id = $2 AND encerra_em > now()`,
    [id, condominioId, vinculoId],
  );
  return rowCount > 0;
}

export async function exists(id, condominioId, db = pool) {
  const { rowCount } = await db.query(
    'SELECT 1 FROM enquetes WHERE id = $1 AND condominio_id = $2',
    [id, condominioId],
  );
  return rowCount > 0;
}

export async function contarAbertas(condominioId, db = pool) {
  const { rows } = await db.query(
    'SELECT count(*)::int AS n FROM enquetes WHERE condominio_id = $1 AND encerra_em > now()',
    [condominioId],
  );
  return rows[0].n;
}
