import { AppError } from '@/lib/errors';
import { withTransaction } from '@/lib/db';
import * as condominiosRepo from '@/repositories/condominiosRepository';
import * as vinculosRepo from '@/repositories/vinculosRepository';

/** RF.03 / RN.04 (versão 2): o síndico aprova ou recusa os cadastros pendentes do condomínio. */
export async function listarPendentes(session) {
  const pendentes = await vinculosRepo.listPendentesByCondominio(session.condominioId);
  return pendentes.map((p) => ({
    id: Number(p.id),
    nome: p.nome_completo,
    email: p.email,
    telefone: p.telefone,
    perfil: p.perfil,
    unidadeId: p.unidade_id ? Number(p.unidade_id) : null,
    unidade: p.unidade_numero ? `Apto ${p.unidade_numero} - Bloco ${p.bloco_nome}` : null,
    criadoEm: p.criado_em,
  }));
}

async function pendenteDoCondominio(session, id) {
  const vinculo = await vinculosRepo.findPendente(id, session.condominioId);
  if (!vinculo) throw new AppError(404, 'Cadastro pendente não encontrado.');
  return vinculo;
}

/** Garante que a unidade existe e é do condomínio da sessão. */
export async function unidadeDoCondominio(session, unidadeId) {
  const unidade = await condominiosRepo.findUnidade(unidadeId);
  if (!unidade || String(unidade.condominio_id) !== String(session.condominioId)) {
    throw new AppError(422, 'Dados inválidos.', { unidadeId: 'Unidade não encontrada.' });
  }
  return unidade;
}

/**
 * Aprova o cadastro. RN.04 (revisada): a unidade informada pelo morador é só uma
 * indicação — o síndico pode corrigi-la antes de aprovar.
 */
export async function aprovar(session, id, { unidadeId } = {}) {
  const vinculo = await pendenteDoCondominio(session, id);
  const corrigir =
    vinculo.perfil === 'MORADOR' && unidadeId && String(unidadeId) !== String(vinculo.unidade_id);
  if (corrigir) await unidadeDoCondominio(session, unidadeId);
  await withTransaction(async (db) => {
    if (corrigir)
      await vinculosRepo.definirUnidade(vinculo.id, unidadeId, { derrubarSessao: false }, db);
    await vinculosRepo.ativar(vinculo.id, db);
  });
}

export async function recusar(session, id) {
  const vinculo = await pendenteDoCondominio(session, id);
  await vinculosRepo.remover(vinculo.id);
}
