/**
 * Consultas SQL de chamados (chamados, anexos_chamado e chamado_acompanhamentos).
 * Camada de dados (repository): só executa SQL, sem regras de negócio.
 * O último parâmetro `db` permite rodar a consulta dentro de uma transação (withTransaction).
 */

import { query } from '@/lib/db';

// Padrão: usa o pool de conexões; numa transação, recebe o client da transação.
const pool = { query };

// Colunas devolvidas para a tela: dados do chamado, categoria, solicitante, unidade,
// lista de anexos (sem o conteúdo) e quantidade de comentários.
const CAMPOS = `
  c.id, c.titulo, c.descricao, c.urgencia, c.status, c.criado_em, c.atualizado_em,
  c.resolvido_em, c.solicitante_id, c.categoria_id, cat.nome AS categoria,
  u.nome_completo AS solicitante, v.perfil AS perfil_solicitante,
  un.numero AS unidade_numero, b.nome AS bloco_nome,
  COALESCE((SELECT json_agg(json_build_object('id', x.id, 'nome', x.nome_arquivo,
                                              'mime', x.mime_type, 'tamanho', x.tamanho_bytes)
                            ORDER BY x.id)
              FROM anexos_chamado x WHERE x.chamado_id = c.id), '[]') AS anexos,
  (SELECT count(*)::int FROM chamado_acompanhamentos h
    WHERE h.chamado_id = c.id AND h.comentario IS NOT NULL) AS comentarios`;

// Tabelas ligadas para montar esses campos.
const FROM = `
  FROM chamados c
  JOIN categorias_chamado cat ON cat.id = c.categoria_id
  JOIN vinculos_condominio v ON v.id = c.solicitante_id
  JOIN usuarios u ON u.id = v.usuario_id
  LEFT JOIN unidades un ON un.id = c.unidade_id
  LEFT JOIN blocos b ON b.id = un.bloco_id`;

/** Chamados do condomínio; com `solicitanteId`, só os abertos por esse vínculo. */
export async function listByCondominio(condominioId, { solicitanteId } = {}, db = pool) {
  const params = [condominioId];
  let filtro = '';
  if (solicitanteId) {
    params.push(solicitanteId);
    filtro = 'AND c.solicitante_id = $2';
  }
  const { rows } = await db.query(
    `SELECT ${CAMPOS} ${FROM}
      WHERE c.condominio_id = $1 ${filtro}
      ORDER BY CASE c.urgencia WHEN 'ALTA' THEN 0 WHEN 'MEDIA' THEN 1 ELSE 2 END,
               c.criado_em DESC`,
    params,
  );
  return rows;
}

// Chamado pelo id, só se for do condomínio informado.
export async function findById(id, condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT ${CAMPOS} ${FROM} WHERE c.id = $1 AND c.condominio_id = $2`,
    [id, condominioId],
  );
  return rows[0] ?? null;
}

/** Bloqueia a linha para a troca de status (duas pessoas mexendo ao mesmo tempo). */
export async function lockStatus(id, condominioId, db = pool) {
  const { rows } = await db.query(
    'SELECT id, status, solicitante_id FROM chamados WHERE id = $1 AND condominio_id = $2 FOR UPDATE',
    [id, condominioId],
  );
  return rows[0] ?? null;
}

// Categorias de chamado, em ordem alfabética.
export async function listCategorias(db = pool) {
  const { rows } = await db.query('SELECT id, nome FROM categorias_chamado ORDER BY nome');
  return rows;
}

// Confere se a categoria informada existe.
export async function categoriaExiste(id, db = pool) {
  const { rowCount } = await db.query('SELECT 1 FROM categorias_chamado WHERE id = $1', [id]);
  return rowCount > 0;
}

// Insere o chamado (status inicial ABERTO) e devolve o id.
export async function create(c, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO chamados (condominio_id, solicitante_id, unidade_id, categoria_id, urgencia, titulo, descricao)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      c.condominioId,
      c.solicitanteId,
      c.unidadeId,
      c.categoriaId,
      c.urgencia,
      c.titulo,
      c.descricao,
    ],
  );
  return rows[0];
}

// Muda o status; resolvido_em é preenchido só quando o status é RESOLVIDO.
export async function updateStatus(id, status, db = pool) {
  await db.query(
    `UPDATE chamados
        SET status = $2::status_chamado, atualizado_em = now(),
            resolvido_em = CASE WHEN $2::status_chamado = 'RESOLVIDO' THEN now() END
      WHERE id = $1`,
    [id, status],
  );
}

// Atualiza a data da última alteração (usado quando só há comentário).
export async function tocar(id, db = pool) {
  await db.query('UPDATE chamados SET atualizado_em = now() WHERE id = $1', [id]);
}

// Registra uma linha no histórico: novo status e/ou comentário, com o autor.
export async function addAcompanhamento(chamadoId, { autorId, novoStatus, comentario }, db = pool) {
  await db.query(
    `INSERT INTO chamado_acompanhamentos (chamado_id, autor_id, novo_status, comentario)
     VALUES ($1, $2, $3, $4)`,
    [chamadoId, autorId, novoStatus ?? null, comentario ?? null],
  );
}

// Histórico do chamado em ordem cronológica, com nome e perfil de quem fez.
export async function listAcompanhamentos(chamadoId, db = pool) {
  const { rows } = await db.query(
    `SELECT h.id, h.novo_status, h.comentario, h.criado_em,
            u.nome_completo AS autor, v.perfil
       FROM chamado_acompanhamentos h
       JOIN vinculos_condominio v ON v.id = h.autor_id
       JOIN usuarios u ON u.id = v.usuario_id
      WHERE h.chamado_id = $1
      ORDER BY h.criado_em, h.id`,
    [chamadoId],
  );
  return rows;
}

// Guarda a foto do chamado no banco.
export async function addAnexo(chamadoId, f, db = pool) {
  await db.query(
    `INSERT INTO anexos_chamado (chamado_id, nome_arquivo, storage_path, mime_type, tamanho_bytes, conteudo)
     VALUES ($1, $2, 'banco', $3, $4, $5)`,
    [chamadoId, f.nome, f.mime, f.tamanho, f.conteudo],
  );
}

/** Anexo com conteúdo, só se o chamado for do condomínio informado. */
export async function findAnexo(chamadoId, anexoId, condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT x.nome_arquivo, x.mime_type, x.tamanho_bytes, x.conteudo, c.solicitante_id
       FROM anexos_chamado x
       JOIN chamados c ON c.id = x.chamado_id
      WHERE x.id = $2 AND x.chamado_id = $1 AND c.condominio_id = $3`,
    [chamadoId, anexoId, condominioId],
  );
  return rows[0] ?? null;
}

/** Quantidade de chamados não resolvidos (Visão Geral). */
export async function contarAbertos(condominioId, { solicitanteId } = {}, db = pool) {
  const params = [condominioId];
  let filtro = '';
  if (solicitanteId) {
    params.push(solicitanteId);
    filtro = 'AND solicitante_id = $2';
  }
  const { rows } = await db.query(
    `SELECT count(*)::int AS n FROM chamados
      WHERE condominio_id = $1 AND status <> 'RESOLVIDO' ${filtro}`,
    params,
  );
  return rows[0].n;
}
