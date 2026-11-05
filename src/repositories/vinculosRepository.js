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

/** Cadastros aguardando aprovação no condomínio (vínculos inativos). */
export async function listPendentesByCondominio(condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT v.id, v.perfil, v.criado_em,
            u.nome_completo, u.email, u.telefone,
            un.numero AS unidade_numero, b.nome AS bloco_nome
       FROM vinculos_condominio v
       JOIN usuarios u ON u.id = v.usuario_id
       LEFT JOIN unidades un ON un.id = v.unidade_id
       LEFT JOIN blocos b ON b.id = un.bloco_id
      WHERE v.condominio_id = $1 AND NOT v.ativo
      ORDER BY v.criado_em`,
    [condominioId],
  );
  return rows;
}

/** Vínculo pendente do condomínio (ou null): garante que o síndico só age no próprio condomínio. */
export async function findPendente(id, condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT id, usuario_id, perfil FROM vinculos_condominio
      WHERE id = $1 AND condominio_id = $2 AND NOT ativo`,
    [id, condominioId],
  );
  return rows[0] ?? null;
}

export async function ativar(id, db = pool) {
  await db.query('UPDATE vinculos_condominio SET ativo = true WHERE id = $1', [id]);
}

/** Recusa = remove o vínculo; a conta fica sem acesso ao condomínio. */
export async function remover(id, db = pool) {
  await db.query('DELETE FROM vinculos_condominio WHERE id = $1', [id]);
}

export async function existePendente(usuarioId, db = pool) {
  const { rows } = await db.query(
    'SELECT 1 FROM vinculos_condominio WHERE usuario_id = $1 AND NOT ativo LIMIT 1',
    [usuarioId],
  );
  return rows.length > 0;
}
