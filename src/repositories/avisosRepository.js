import { query } from '@/lib/db';

const pool = { query };

/**
 * Mural do condomínio: urgentes primeiro, depois os mais recentes.
 * Traz se o usuário já leu, quantas leituras o aviso tem e os anexos (sem o conteúdo).
 */
export async function listByCondominio(condominioId, usuarioId, { categoriaId } = {}, db = pool) {
  const { rows } = await db.query(
    `SELECT a.id, a.titulo, a.corpo, a.prioridade, a.publicado_em, a.atualizado_em,
            a.categoria_id, c.nome AS categoria, u.nome_completo AS autor,
            EXISTS (SELECT 1 FROM aviso_leituras l WHERE l.aviso_id = a.id AND l.usuario_id = $2) AS lido,
            (SELECT count(*) FROM aviso_leituras l WHERE l.aviso_id = a.id)::int AS leituras,
            COALESCE((SELECT json_agg(json_build_object('id', x.id, 'nome', x.nome_arquivo,
                                                        'mime', x.mime_type, 'tamanho', x.tamanho_bytes)
                                      ORDER BY x.id)
                        FROM anexos_aviso x WHERE x.aviso_id = a.id), '[]') AS anexos
       FROM avisos a
       JOIN categorias_aviso c ON c.id = a.categoria_id
       JOIN vinculos_condominio v ON v.id = a.autor_id
       JOIN usuarios u ON u.id = v.usuario_id
      WHERE a.condominio_id = $1 AND ($3::smallint IS NULL OR a.categoria_id = $3)
      ORDER BY (a.prioridade = 'URGENTE') DESC, a.publicado_em DESC
      LIMIT 100`,
    [condominioId, usuarioId, categoriaId ?? null],
  );
  return rows;
}

export async function listCategorias(db = pool) {
  const { rows } = await db.query('SELECT id, nome FROM categorias_aviso ORDER BY nome');
  return rows;
}

export async function categoriaExiste(id, db = pool) {
  const { rows } = await db.query('SELECT 1 FROM categorias_aviso WHERE id = $1', [id]);
  return rows.length > 0;
}

export async function contarNaoLidos(condominioId, usuarioId, db = pool) {
  const { rows } = await db.query(
    `SELECT count(*)::int AS n FROM avisos a
      WHERE a.condominio_id = $1
        AND NOT EXISTS (SELECT 1 FROM aviso_leituras l WHERE l.aviso_id = a.id AND l.usuario_id = $2)`,
    [condominioId, usuarioId],
  );
  return rows[0].n;
}

export async function findById(id, condominioId, db = pool) {
  const { rows } = await db.query(
    'SELECT id, titulo FROM avisos WHERE id = $1 AND condominio_id = $2',
    [id, condominioId],
  );
  return rows[0] ?? null;
}

export async function create(a, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO avisos (condominio_id, categoria_id, autor_id, titulo, corpo, prioridade)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [a.condominioId, a.categoriaId, a.autorId, a.titulo, a.corpo, a.prioridade],
  );
  return rows[0];
}

export async function update(id, a, db = pool) {
  await db.query(
    `UPDATE avisos SET categoria_id = $2, titulo = $3, corpo = $4, prioridade = $5,
                       atualizado_em = now()
      WHERE id = $1`,
    [id, a.categoriaId, a.titulo, a.corpo, a.prioridade],
  );
}

export async function remove(id, db = pool) {
  await db.query('DELETE FROM avisos WHERE id = $1', [id]);
}

export async function addAnexo(avisoId, f, db = pool) {
  await db.query(
    `INSERT INTO anexos_aviso (aviso_id, nome_arquivo, storage_path, mime_type, tamanho_bytes, conteudo)
     VALUES ($1, $2, 'banco', $3, $4, $5)`,
    [avisoId, f.nome, f.mime, f.tamanho, f.conteudo],
  );
}

export async function removeAnexos(avisoId, db = pool) {
  await db.query('DELETE FROM anexos_aviso WHERE aviso_id = $1', [avisoId]);
}

/** Anexo com conteúdo, só se o aviso for do condomínio informado. */
export async function findAnexo(avisoId, anexoId, condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT x.nome_arquivo, x.mime_type, x.tamanho_bytes, x.conteudo
       FROM anexos_aviso x
       JOIN avisos a ON a.id = x.aviso_id
      WHERE x.id = $2 AND x.aviso_id = $1 AND a.condominio_id = $3`,
    [avisoId, anexoId, condominioId],
  );
  return rows[0] ?? null;
}

export async function marcarLido(avisoId, usuarioId, db = pool) {
  await db.query(
    `INSERT INTO aviso_leituras (aviso_id, usuario_id) VALUES ($1, $2)
     ON CONFLICT (aviso_id, usuario_id) DO NOTHING`,
    [avisoId, usuarioId],
  );
}
