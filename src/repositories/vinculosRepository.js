import { query } from '@/lib/db';

const pool = { query };

/**
 * Vínculos ativos do usuário, do perfil mais alto para o mais baixo.
 * Por enquanto a sessão usa o primeiro; a troca de condomínio/perfil fica para o módulo de conta.
 */
export async function listAtivosByUsuario(usuarioId, db = pool) {
  const { rows } = await db.query(
    `SELECT v.id, v.condominio_id, v.perfil, v.unidade_id, c.nome AS condominio_nome
       FROM vinculos_condominio v
       JOIN condominios c ON c.id = v.condominio_id
      WHERE v.usuario_id = $1 AND v.ativo
      ORDER BY array_position(ARRAY['ADMIN','SINDICO','PORTARIA','MORADOR']::perfil_acesso[], v.perfil),
               v.criado_em`,
    [usuarioId],
  );
  return rows;
}

export async function create({ usuarioId, condominioId, perfil, unidadeId, ativo }, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO vinculos_condominio (usuario_id, condominio_id, perfil, unidade_id, ativo)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, condominio_id, perfil, unidade_id, ativo`,
    [usuarioId, condominioId, perfil, unidadeId ?? null, ativo],
  );
  return rows[0];
}
