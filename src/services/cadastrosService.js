import { AppError } from '@/lib/errors';
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
    unidade: p.unidade_numero ? `Apto ${p.unidade_numero} - Bloco ${p.bloco_nome}` : null,
    criadoEm: p.criado_em,
  }));
}

async function pendenteDoCondominio(session, id) {
  const vinculo = await vinculosRepo.findPendente(id, session.condominioId);
  if (!vinculo) throw new AppError(404, 'Cadastro pendente não encontrado.');
  return vinculo;
}

export async function aprovar(session, id) {
  const vinculo = await pendenteDoCondominio(session, id);
  await vinculosRepo.ativar(vinculo.id);
}

export async function recusar(session, id) {
  const vinculo = await pendenteDoCondominio(session, id);
  await vinculosRepo.remover(vinculo.id);
}
