/**
 * Consultas SQL dos vínculos usuário-condomínio (perfil, unidade, ativo, sessão).
 * Camada de dados (repository): só executa SQL, sem regras de negócio.
 * O último parâmetro `db` permite rodar a consulta dentro de uma transação (withTransaction).
 */

import { query } from '@/lib/db';

// Padrão: usa o pool de conexões; numa transação, recebe o client da transação.
const pool = { query };

/**
 * Vínculos ativos do usuário, do perfil mais alto para o mais baixo.
 * Por enquanto a sessão usa o primeiro; a troca de condomínio/perfil fica para o módulo de conta.
 */
export async function listAtivosByUsuario(usuarioId, db = pool) {
  const { rows } = await db.query(
    `SELECT v.id, v.condominio_id, v.perfil, v.unidade_id, v.sessao_versao, c.nome AS condominio_nome
       FROM vinculos_condominio v
       JOIN condominios c ON c.id = v.condominio_id
      WHERE v.usuario_id = $1 AND v.ativo
      ORDER BY array_position(ARRAY['ADMIN','SINDICO','PORTARIA','MORADOR']::perfil_acesso[], v.perfil),
               v.criado_em`,
    [usuarioId],
  );
  return rows;
}

// Cria o vínculo (no cadastro público ele nasce inativo, aguardando aprovação).
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
    `SELECT v.id, v.perfil, v.criado_em, v.unidade_id,
            u.nome_completo, u.email, u.telefone,
            un.numero AS unidade_numero, b.nome AS bloco_nome
       FROM vinculos_condominio v
       JOIN usuarios u ON u.id = v.usuario_id
       LEFT JOIN unidades un ON un.id = v.unidade_id
       LEFT JOIN blocos b ON b.id = un.bloco_id
      WHERE v.condominio_id = $1 AND NOT v.ativo AND v.encerrado_em IS NULL
      ORDER BY v.criado_em`,
    [condominioId],
  );
  return rows;
}

/** Vínculo pendente do condomínio (ou null): garante que o síndico só age no próprio condomínio. */
export async function findPendente(id, condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT id, usuario_id, perfil, unidade_id FROM vinculos_condominio
      WHERE id = $1 AND condominio_id = $2 AND NOT ativo AND encerrado_em IS NULL`,
    [id, condominioId],
  );
  return rows[0] ?? null;
}

// Aprova o cadastro: o vínculo passa a ativo.
export async function ativar(id, db = pool) {
  await db.query('UPDATE vinculos_condominio SET ativo = true WHERE id = $1', [id]);
}

/** Recusa = remove o vínculo; a conta fica sem acesso ao condomínio. */
export async function remover(id, db = pool) {
  await db.query('DELETE FROM vinculos_condominio WHERE id = $1', [id]);
}

// O usuário já tem um cadastro aguardando aprovação?
export async function existePendente(usuarioId, db = pool) {
  const { rows } = await db.query(
    'SELECT 1 FROM vinculos_condominio WHERE usuario_id = $1 AND NOT ativo AND encerrado_em IS NULL LIMIT 1',
    [usuarioId],
  );
  return rows.length > 0;
}

/** Estado atual do vínculo da sessão (para derrubar sessões após troca de perfil/unidade). */
export async function findEstadoSessao(vinculoId, db = pool) {
  const { rows } = await db.query(
    `SELECT v.perfil, v.ativo, v.sessao_versao, u.ativo AS usuario_ativo
       FROM vinculos_condominio v
       JOIN usuarios u ON u.id = v.usuario_id
      WHERE v.id = $1`,
    [vinculoId],
  );
  return rows[0] ?? null;
}

/** Síndico ativo do condomínio (no máximo um — índice ux_um_sindico_ativo). */
export async function findSindicoAtivo(condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT v.id, v.usuario_id, v.unidade_id, u.nome_completo, un.numero AS unidade_numero, b.nome AS bloco_nome
       FROM vinculos_condominio v
       JOIN usuarios u ON u.id = v.usuario_id
       LEFT JOIN unidades un ON un.id = v.unidade_id
       LEFT JOIN blocos b ON b.id = un.bloco_id
      WHERE v.condominio_id = $1 AND v.perfil = 'SINDICO' AND v.ativo
      FOR UPDATE OF v`,
    [condominioId],
  );
  return rows[0] ?? null;
}

/** Moradores ativos do condomínio (candidatos a síndico). */
export async function listMoradoresAtivos(condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT v.id, u.nome_completo, un.numero AS unidade_numero, b.nome AS bloco_nome
       FROM vinculos_condominio v
       JOIN usuarios u ON u.id = v.usuario_id AND u.ativo
       JOIN unidades un ON un.id = v.unidade_id
       JOIN blocos b ON b.id = un.bloco_id
      WHERE v.condominio_id = $1 AND v.perfil = 'MORADOR' AND v.ativo
      ORDER BY b.nome, un.numero, u.nome_completo`,
    [condominioId],
  );
  return rows;
}

// Morador ativo do condomínio pelo id do vínculo (para designar síndico).
export async function findMoradorAtivo(vinculoId, condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT v.id, v.usuario_id, u.nome_completo
       FROM vinculos_condominio v
       JOIN usuarios u ON u.id = v.usuario_id AND u.ativo
      WHERE v.id = $1 AND v.condominio_id = $2 AND v.perfil = 'MORADOR' AND v.ativo
      FOR UPDATE OF v`,
    [vinculoId, condominioId],
  );
  return rows[0] ?? null;
}

/**
 * Muda perfil/ativo do vínculo e derruba as sessões abertas dele.
 * Desativar aqui encerra o vínculo (não volta para a fila de aprovação).
 */
export async function alterarPapel(vinculoId, { perfil, ativo }, db = pool) {
  await db.query(
    `UPDATE vinculos_condominio
        SET perfil = $2, ativo = $3, sessao_versao = sessao_versao + 1,
            encerrado_em = CASE WHEN $3 THEN NULL ELSE now() END
      WHERE id = $1`,
    [vinculoId, perfil, ativo],
  );
}

/** Moradores ativos com unidade (inclui o síndico que mora no condomínio). */
export async function listResidentes(condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT v.id, v.perfil, v.unidade_id, u.nome_completo, u.email, u.telefone
       FROM vinculos_condominio v
       JOIN usuarios u ON u.id = v.usuario_id
      WHERE v.condominio_id = $1 AND v.ativo AND v.unidade_id IS NOT NULL
        AND v.perfil IN ('MORADOR', 'SINDICO')
      ORDER BY u.nome_completo`,
    [condominioId],
  );
  return rows;
}

/** Vínculo ativo do condomínio com um dos perfis informados (ou null). */
export async function findAtivo(id, condominioId, perfis, db = pool) {
  const { rows } = await db.query(
    `SELECT v.id, v.usuario_id, v.perfil, v.unidade_id, u.nome_completo
       FROM vinculos_condominio v
       JOIN usuarios u ON u.id = v.usuario_id
      WHERE v.id = $1 AND v.condominio_id = $2 AND v.ativo AND v.perfil = ANY($3::perfil_acesso[])`,
    [id, condominioId, perfis],
  );
  return rows[0] ?? null;
}

/** Troca a unidade do vínculo e derruba as sessões abertas dele. */
export async function definirUnidade(id, unidadeId, { derrubarSessao = true } = {}, db = pool) {
  await db.query(
    `UPDATE vinculos_condominio
        SET unidade_id = $2,
            sessao_versao = sessao_versao + CASE WHEN $3 THEN 1 ELSE 0 END
      WHERE id = $1`,
    [id, unidadeId, derrubarSessao],
  );
}

/** Encerra o vínculo (morador que saiu, porteiro desligado): sem acesso e fora da fila. */
export async function encerrar(id, db = pool) {
  await db.query(
    `UPDATE vinculos_condominio
        SET ativo = false, encerrado_em = now(), sessao_versao = sessao_versao + 1
      WHERE id = $1`,
    [id],
  );
}

// Contas da portaria do condomínio (ativas e desativadas).
export async function listPortaria(condominioId, db = pool) {
  const { rows } = await db.query(
    `SELECT v.id, v.criado_em, u.nome_completo, u.email, u.telefone
       FROM vinculos_condominio v
       JOIN usuarios u ON u.id = v.usuario_id
      WHERE v.condominio_id = $1 AND v.ativo AND v.perfil = 'PORTARIA'
      ORDER BY u.nome_completo`,
    [condominioId],
  );
  return rows;
}
