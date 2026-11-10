/**
 * Portaria e controle de visitantes (RF.10 / RN.14).
 * Camada de regras de negócio (service): confere o perfil de quem pede, valida as regras
 * e chama os repositories. Os erros (AppError) viram a resposta HTTP na rota da API.
 */

import { AppError } from '@/lib/errors';
import { formatPlaca, mascararDocumento } from '@/lib/masks';
import { FUSO_CONDOMINIO } from '@/lib/turnos';
import * as condominiosRepo from '@/repositories/condominiosRepository';
import * as visitasRepo from '@/repositories/visitasRepository';

/*
 * RF.10 / RN.14 (versão 2) — portaria e controle de visitantes.
 * - O morador PRÉ-AUTORIZA o visitante da própria unidade.
 * - Visitante não previsto é registrado pela portaria e AGUARDA a confirmação do morador
 *   (pelo app ou pelo interfone, que fica registrado).
 * - Só entra visitante autorizado; a portaria registra entrada e saída.
 * - A listagem mostra o documento mascarado (LGPD).
 */
const EQUIPE = ['PORTARIA', 'SINDICO', 'ADMIN'];
// A previsão da visita pode ser até 30 minutos no passado (ex.: visitante já chegando).
const TOLERANCIA_PREVISAO_MS = 30 * 60 * 1000;

const ehEquipe = (s) => EQUIPE.includes(s.perfil);
const ehMorador = (s) => s.perfil === 'MORADOR';

// Converte a visita no formato da tela, com o documento mascarado (LGPD).
function paraTela(v) {
  return {
    id: Number(v.id),
    nome: v.nome,
    documento: `${v.tipo_documento} ${mascararDocumento(v.tipo_documento, v.documento)}`,
    unidade: `Apto ${v.unidade_numero} - Bloco ${v.bloco_nome}`,
    placa: v.placa_veiculo ? formatPlaca(v.placa_veiculo) : null,
    previsao: v.previsao_entrada,
    entrada: v.entrada_em,
    saida: v.saida_em,
    status: v.status,
    autorizacaoVia: v.autorizacao_via,
    convite: String(v.codigo_convite).slice(0, 8).toUpperCase(),
  };
}

// Morador vê as visitas da própria unidade; portaria e síndico, as do condomínio.
export async function listar(session) {
  if (ehMorador(session)) {
    if (!session.unidadeId) return { perfil: 'MORADOR', visitas: [], unidades: [] };
    const visitas = await visitasRepo.listDaUnidade(session.unidadeId);
    return { perfil: 'MORADOR', visitas: visitas.map(paraTela), unidades: [] };
  }
  if (!ehEquipe(session)) throw new AppError(403, 'Acesso negado.');
  const [visitas, unidades] = await Promise.all([
    visitasRepo.listDoCondominio(session.condominioId),
    condominiosRepo.listUnidades(session.condominioId),
  ]);
  return {
    perfil: session.perfil,
    visitas: visitas.map(paraTela),
    unidades: unidades.map((u) => ({
      id: Number(u.id),
      rotulo: `Apto ${u.numero} - Bloco ${u.bloco}`,
    })),
  };
}

/** Morador pré-autoriza o visitante: a visita já nasce AUTORIZADA. */
export async function preAutorizar(session, dados, agora = new Date()) {
  if (!ehMorador(session)) {
    throw new AppError(403, 'Apenas moradores pré-autorizam visitantes.');
  }
  if (!session.unidadeId) {
    throw new AppError(422, 'Seu cadastro não tem unidade vinculada. Procure o síndico.');
  }
  const previsao = new Date(`${dados.previsao}:00${FUSO_CONDOMINIO}`);
  if (Number.isNaN(previsao.getTime()) || previsao < new Date(agora - TOLERANCIA_PREVISAO_MS)) {
    throw new AppError(422, 'Dados inválidos.', {
      previsao: 'Informe uma data e horário a partir de agora.',
    });
  }
  const visitanteId = await visitasRepo.upsertVisitante({
    condominioId: session.condominioId,
    nome: dados.nome,
    tipoDocumento: dados.tipoDocumento,
    documento: dados.documento,
  });
  const visita = await visitasRepo.create({
    visitanteId,
    unidadeId: session.unidadeId,
    autorizadoPorId: session.vinculoId,
    registradaPorId: session.vinculoId,
    placa: dados.placa,
    previsao,
    status: 'AUTORIZADO',
    autorizacaoVia: 'PRE_AUTORIZACAO',
  });
  return {
    id: Number(visita.id),
    convite: String(visita.codigo_convite).slice(0, 8).toUpperCase(),
  };
}

/** Portaria registra visitante não previsto: fica AGUARDANDO a confirmação do morador. */
export async function registrarNaoPrevisto(session, dados) {
  if (!ehEquipe(session)) throw new AppError(403, 'Acesso negado.');
  const unidade = await condominiosRepo.findUnidade(dados.unidadeId);
  if (!unidade || String(unidade.condominio_id) !== String(session.condominioId)) {
    throw new AppError(422, 'Dados inválidos.', { unidadeId: 'Unidade não encontrada.' });
  }
  const visitanteId = await visitasRepo.upsertVisitante({
    condominioId: session.condominioId,
    nome: dados.nome,
    tipoDocumento: dados.tipoDocumento,
    documento: dados.documento,
  });
  const visita = await visitasRepo.create({
    visitanteId,
    unidadeId: unidade.id,
    registradaPorId: session.vinculoId,
    placa: dados.placa,
    previsao: new Date(),
    status: 'AGUARDANDO',
  });
  return { id: Number(visita.id) };
}

/*
 * Ações sobre a visita: de qual status parte, para qual vai e quem pode.
 * AUTORIZAR/RECUSAR: morador da unidade (pelo app) ou portaria (confirmação pelo interfone).
 * CANCELAR: morador desiste de uma pré-autorização antes da entrada.
 * ENTRADA/SAIDA: só a portaria (ou o síndico).
 */
const ACOES = {
  AUTORIZAR: { de: 'AGUARDANDO', para: 'AUTORIZADO', morador: true, equipe: true },
  RECUSAR: { de: 'AGUARDANDO', para: 'CANCELADO', morador: true, equipe: true },
  CANCELAR: { de: 'AUTORIZADO', para: 'CANCELADO', morador: true, equipe: false },
  ENTRADA: { de: 'AUTORIZADO', para: 'PRESENTE', morador: false, equipe: true },
  SAIDA: { de: 'PRESENTE', para: 'FINALIZADO', morador: false, equipe: true },
};

// Mensagem quando a visita já não está no status esperado para a ação.
const MENSAGEM_STATUS = {
  AUTORIZAR: 'Esta visita não está mais aguardando confirmação.',
  RECUSAR: 'Esta visita não está mais aguardando confirmação.',
  CANCELAR: 'Só é possível cancelar uma autorização antes da entrada do visitante.',
  ENTRADA: 'Só é possível registrar a entrada de visitante autorizado pelo morador.',
  SAIDA: 'Só é possível registrar a saída de visitante que está no condomínio.',
};

// Executa uma ação da tabela ACOES, conferindo perfil, unidade e status atual.
export async function executarAcao(session, id, acao) {
  const regra = ACOES[acao];
  if (!regra) throw new AppError(422, 'Ação inválida.');
  const morador = ehMorador(session);
  if ((morador && !regra.morador) || (!morador && !(ehEquipe(session) && regra.equipe))) {
    throw new AppError(403, 'Seu perfil não pode realizar esta ação.');
  }

  const visita = await visitasRepo.findById(id, session.condominioId);
  // Morador só enxerga as visitas da própria unidade
  if (!visita || (morador && String(visita.unidade_id) !== String(session.unidadeId))) {
    throw new AppError(404, 'Visita não encontrada.');
  }
  if (visita.status !== regra.de) throw new AppError(409, MENSAGEM_STATUS[acao]);

  // Ao autorizar, registra quem autorizou e como (app = morador; interfone = portaria).
  const extras =
    acao === 'AUTORIZAR'
      ? { autorizadoPorId: session.vinculoId, autorizacaoVia: morador ? 'APP' : 'INTERFONE' }
      : {};
  const ok = await visitasRepo.transicionar(visita.id, regra.de, regra.para, extras);
  if (!ok) throw new AppError(409, 'A visita foi atualizada por outra pessoa. Recarregue a tela.');
  return { status: regra.para };
}
