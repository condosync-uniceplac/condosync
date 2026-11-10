/**
 * Reservas de áreas comuns (RF.09 / RN.12).
 * Camada de regras de negócio (service): confere o perfil de quem pede, valida as regras
 * e chama os repositories. Os erros (AppError) viram a resposta HTTP na rota da API.
 */

import { withTransaction } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { ANTECEDENCIA_CANCELAMENTO_HORAS, intervaloDoTurno } from '@/lib/turnos';
import * as reservasRepo from '@/repositories/reservasRepository';

/*
 * RF.09 / RN.12 (versão 2) — reservas de áreas comuns.
 * - O espaço não pode ter horários sobrepostos.
 * - O morador não pode ter duas reservas ao mesmo tempo (em qualquer espaço).
 * - O morador cancela a própria reserva com antecedência mínima; o síndico cancela qualquer uma.
 * - O morador vê só as próprias reservas; síndico e portaria veem as do condomínio.
 */
const GESTAO = ['SINDICO', 'ADMIN'];
const VEEM_TODAS = ['SINDICO', 'ADMIN', 'PORTARIA'];
const HORA_MS = 60 * 60 * 1000;

/** Reserva quem mora no condomínio: morador ou síndico com unidade. */
const podeReservar = (s) =>
  s.perfil === 'MORADOR' || (s.perfil === 'SINDICO' && Boolean(s.unidadeId));

// Texto da unidade de quem reservou.
const unidadeTexto = (r) =>
  r.unidade_numero ? `Apto ${r.unidade_numero} - Bloco ${r.bloco_nome}` : null;

// Converte a reserva no formato da tela (marca as do próprio usuário).
function paraTela(r, session) {
  return {
    id: Number(r.id),
    espacoId: Number(r.espaco_id),
    espaco: r.espaco_nome,
    inicio: r.inicio,
    fim: r.fim,
    status: r.status,
    convidados: r.convidados,
    valor: Number(r.valor_cobrado),
    responsavel: r.responsavel,
    unidade: unidadeTexto(r),
    minha: String(r.vinculo_id) === String(session.vinculoId),
  };
}

// Espaços, reservas visíveis ao perfil e ocupação dos espaços (para a tela travar turnos).
export async function listar(session) {
  const [espacos, reservas, ocupacao] = await Promise.all([
    reservasRepo.listEspacos(session.condominioId),
    reservasRepo.listAtivas(session.condominioId, {
      vinculoId: VEEM_TODAS.includes(session.perfil) ? null : session.vinculoId,
    }),
    reservasRepo.listOcupacao(session.condominioId),
  ]);
  return {
    podeReservar: podeReservar(session),
    espacos: espacos.map((e) => ({
      id: Number(e.id),
      nome: e.nome,
      descricao: e.descricao,
      capacidade: e.capacidade_pessoas,
      valor: Number(e.valor),
    })),
    reservas: reservas.map((r) => paraTela(r, session)),
    ocupacao: ocupacao.map((o) => ({
      espacoId: Number(o.espaco_id),
      inicio: o.inicio,
      fim: o.fim,
    })),
  };
}

// Cria a reserva conferindo turno futuro, capacidade e conflitos (do espaço e do morador).
export async function criar(session, { espacoId, data, turno, convidados }, agora = new Date()) {
  if (!podeReservar(session)) {
    throw new AppError(403, 'Apenas moradores podem reservar áreas comuns.');
  }
  const intervalo = intervaloDoTurno(data, turno);
  if (!intervalo || Number.isNaN(intervalo.inicio.getTime())) {
    throw new AppError(422, 'Dados inválidos.', { data: 'Data ou turno inválido.' });
  }
  if (intervalo.inicio <= agora) {
    throw new AppError(422, 'Dados inválidos.', { data: 'Escolha uma data e turno futuros.' });
  }

  // Tudo numa transação com travas, para dois pedidos simultâneos não passarem juntos.
  return withTransaction(async (db) => {
    const espaco = await reservasRepo.findEspacoParaReserva(espacoId, session.condominioId, db);
    if (!espaco) throw new AppError(404, 'Espaço não encontrado.');
    if (convidados > espaco.capacidade_pessoas) {
      throw new AppError(422, 'Dados inválidos.', {
        convidados: `A capacidade do espaço é de ${espaco.capacidade_pessoas} pessoas.`,
      });
    }

    await reservasRepo.travarMorador(session.vinculoId, db);
    if (await reservasRepo.existeConflitoEspaco(espaco.id, intervalo.inicio, intervalo.fim, db)) {
      throw new AppError(409, 'Este espaço já está reservado nesse horário.');
    }
    if (
      await reservasRepo.existeConflitoMorador(
        session.vinculoId,
        intervalo.inicio,
        intervalo.fim,
        db,
      )
    ) {
      throw new AppError(409, 'Você já tem outra reserva nesse horário.');
    }

    const criada = await reservasRepo.create(
      {
        espacoId: espaco.id,
        vinculoId: session.vinculoId,
        inicio: intervalo.inicio,
        fim: intervalo.fim,
        convidados,
        valor: espaco.valor,
      },
      db,
    );
    return { id: Number(criada.id), espaco: espaco.nome, ...intervalo };
  });
}

// Cancela a reserva: o morador só a própria e com 24 h de antecedência; o síndico qualquer uma.
export async function cancelar(session, id, agora = new Date()) {
  const gestao = GESTAO.includes(session.perfil);
  if (!gestao && session.perfil !== 'MORADOR') {
    throw new AppError(403, 'Acesso negado.');
  }
  const reserva = await reservasRepo.findById(id, session.condominioId);
  // Morador não enxerga reservas de outros: responde 404 em vez de 403
  if (!reserva || (!gestao && String(reserva.vinculo_id) !== String(session.vinculoId))) {
    throw new AppError(404, 'Reserva não encontrada.');
  }
  if (!['PENDENTE', 'CONFIRMADA'].includes(reserva.status)) {
    throw new AppError(409, 'Esta reserva já foi cancelada ou concluída.');
  }
  const horasAteInicio = (new Date(reserva.inicio) - agora) / HORA_MS;
  if (!gestao && horasAteInicio < ANTECEDENCIA_CANCELAMENTO_HORAS) {
    throw new AppError(
      422,
      `O cancelamento só é permitido com pelo menos ${ANTECEDENCIA_CANCELAMENTO_HORAS} h de antecedência. Procure o síndico.`,
    );
  }
  await reservasRepo.cancelar(reserva.id);
}
