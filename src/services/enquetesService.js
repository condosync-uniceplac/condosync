/**
 * Enquetes e votações (RN.24).
 * Camada de regras de negócio (service): confere o perfil de quem pede, valida as regras
 * e chama os repositories. Os erros (AppError) viram a resposta HTTP na rota da API.
 */

import { withTransaction } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { FUSO_CONDOMINIO, dataLocal } from '@/lib/turnos';
import * as enquetesRepo from '@/repositories/enquetesRepository';

/*
 * RN.24 (versão 2) — enquetes e votações.
 * - Só o síndico (ou o administrador) cria e encerra enquetes.
 * - Um voto por UNIDADE: se outra pessoa da mesma unidade votar, o voto da
 *   unidade é trocado. Pode ser alterado até o encerramento.
 * - Votam moradores e o síndico que tenham unidade; portaria e admin só acompanham.
 * - O resultado parcial fica visível durante a votação; depois do encerramento, é o final.
 */
export const GESTAO = ['SINDICO', 'ADMIN'];
export const PRAZO_MAXIMO_DIAS = 90;

// Vota quem tem unidade: morador ou síndico que mora no condomínio.
const podeVotar = (s) => ['MORADOR', 'SINDICO'].includes(s.perfil) && !!s.unidadeId;

// Converte a linha do banco no formato da tela.
const paraTela = (session) => (e) => ({
  id: Number(e.id),
  pergunta: e.pergunta,
  descricao: e.descricao,
  criador: e.criador,
  criadaEm: e.criado_em,
  encerraEm: e.encerra_em,
  encerrada: e.encerrada,
  encerradaAntes: e.encerrada_antes,
  total: e.total,
  meuVoto: e.meu_voto ? Number(e.meu_voto) : null,
  // Mostra quem votou pela unidade quando não foi o próprio usuário
  votadoPor: e.meu_voto && String(e.votado_por_id) !== String(session.sub) ? e.votado_por : null,
  opcoes: (e.opcoes ?? []).map((o) => ({ id: Number(o.id), texto: o.texto, votos: o.votos })),
});

// Enquetes do condomínio com o voto da unidade de quem vê.
export async function listar(session) {
  const enquetes = await enquetesRepo.listByCondominio(session.condominioId, session.unidadeId);
  return {
    podeCriar: GESTAO.includes(session.perfil),
    podeVotar: podeVotar(session),
    enquetes: enquetes.map(paraTela(session)),
  };
}

// Quantidade de votações abertas.
export async function resumo(session) {
  return { abertas: await enquetesRepo.contarAbertas(session.condominioId) };
}

/** Fim do dia escolhido, no fuso do condomínio. */
function fimDoDia(data, agora) {
  const fim = new Date(`${data}T23:59:59${FUSO_CONDOMINIO}`);
  if (Number.isNaN(fim.getTime()) || dataLocal(fim) !== data) {
    throw new AppError(422, 'Dados inválidos.', { encerraEm: 'Data inválida.' });
  }
  if (data < dataLocal(agora)) {
    throw new AppError(422, 'Dados inválidos.', {
      encerraEm: 'A data de encerramento não pode estar no passado.',
    });
  }
  const limite = new Date(agora.getTime() + PRAZO_MAXIMO_DIAS * 86_400_000);
  if (fim > limite) {
    throw new AppError(422, 'Dados inválidos.', {
      encerraEm: `A votação pode durar no máximo ${PRAZO_MAXIMO_DIAS} dias.`,
    });
  }
  return fim;
}

// Cria a enquete (só síndico/admin) com as opções, numa transação.
export async function criar(session, dados, agora = new Date()) {
  if (!GESTAO.includes(session.perfil)) {
    throw new AppError(403, 'Apenas o síndico pode criar enquetes.');
  }
  const encerraEm = fimDoDia(dados.encerraEm, agora);
  return withTransaction(async (db) => {
    const { id } = await enquetesRepo.create(
      {
        condominioId: session.condominioId,
        criadorId: session.vinculoId,
        pergunta: dados.pergunta,
        descricao: dados.descricao,
        encerraEm,
      },
      db,
    );
    await enquetesRepo.addOpcoes(id, dados.opcoes, db);
    return { id: Number(id) };
  });
}

// Grava ou troca o voto da unidade, se a enquete ainda estiver aberta.
export async function votar(session, enqueteId, { opcaoId }) {
  if (!podeVotar(session)) {
    throw new AppError(403, 'Somente moradores com unidade votam nas enquetes.');
  }
  await withTransaction(async (db) => {
    const enquete = await enquetesRepo.lockAberta(enqueteId, session.condominioId, db);
    if (!enquete) throw new AppError(404, 'Enquete não encontrada.');
    if (enquete.encerrada) throw new AppError(409, 'Esta votação já foi encerrada.');
    if (!(await enquetesRepo.opcaoDaEnquete(enquete.id, opcaoId, db))) {
      throw new AppError(422, 'Dados inválidos.', { opcaoId: 'Opção não encontrada.' });
    }
    await enquetesRepo.votar(
      { enqueteId: enquete.id, unidadeId: session.unidadeId, usuarioId: session.sub, opcaoId },
      db,
    );
  });
}

// Encerra a votação antes do prazo (só síndico/admin).
export async function encerrar(session, enqueteId) {
  if (!GESTAO.includes(session.perfil)) {
    throw new AppError(403, 'Apenas o síndico pode encerrar enquetes.');
  }
  const ok = await enquetesRepo.encerrar(enqueteId, session.condominioId, session.vinculoId);
  if (ok) return;
  if (!(await enquetesRepo.exists(enqueteId, session.condominioId))) {
    throw new AppError(404, 'Enquete não encontrada.');
  }
  throw new AppError(409, 'Esta votação já foi encerrada.');
}
