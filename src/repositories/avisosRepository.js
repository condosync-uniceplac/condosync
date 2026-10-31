import { query } from '@/lib/db';

const pool = { query };

/** Exemplo de módulo: mural de avisos do condomínio, mais recentes primeiro. */
export async function listByCondominio(condominioId, { limit = 20 } = {}, db = pool) {
  const { rows } = await db.query(
    `SELECT a.id, a.titulo, a.corpo, a.prioridade, a.publicado_em,
            c.nome AS categoria, u.nome_completo AS autor
       FROM avisos a
       JOIN categorias_aviso c ON c.id = a.categoria_id
       JOIN vinculos_condominio v ON v.id = a.autor_id
       JOIN usuarios u ON u.id = v.usuario_id
      WHERE a.condominio_id = $1
      ORDER BY (a.prioridade = 'URGENTE') DESC, a.publicado_em DESC
      LIMIT $2`,
    [condominioId, limit],
  );
  return rows;
}
