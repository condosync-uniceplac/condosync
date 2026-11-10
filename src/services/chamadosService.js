/**
 * Chamados e ocorrências (RN.22).
 * Camada de regras de negócio (service): confere o perfil de quem pede, valida as regras
 * e chama os repositories. Os erros (AppError) viram a resposta HTTP na rota da API.
 */

import { withTransaction } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { nomeSeguro, validarAnexo } from '@/lib/anexos';
import * as chamadosRepo from '@/repositories/chamadosRepository';

/*
 * RN.22 (versão 2) / bug #18 — chamados e ocorrências.
 *
 * | Ação                                   | Morador        | Portaria | Síndico |
 * | Abrir chamado e acompanhar             | os próprios    | sim      | sim     |
 * | Mover de Aberto para Em análise        | não            | sim      | sim     |
 * | Registrar comentário de acompanhamento | não            | sim      | sim     |
 * | Marcar como Resolvido                  | não            | não      | sim     |
 * | Reabrir (voltar para Aberto/Em análise)| não            | não      | sim     |
 *
 * O administrador tem os mesmos poderes do síndico. Toda troca de status e todo
 * comentário ficam registrados em chamado_acompanhamentos.
 */
export const STATUS = ['ABERTO', 'EM_ANALISE', 'RESOLVIDO'];
const GESTAO = ['SINDICO', 'ADMIN'];
const COMENTAM = ['PORTARIA', ...GESTAO];
const ROTULO = { ABERTO: 'Aberto', EM_ANALISE: 'Em análise', RESOLVIDO: 'Resolvido' };

/** Para quais status o perfil pode mover um chamado que está em `atual`. */
export function transicoesPermitidas(perfil, atual) {
  if (GESTAO.includes(perfil)) return STATUS.filter((s) => s !== atual);
  if (perfil === 'PORTARIA' && atual === 'ABERTO') return ['EM_ANALISE'];
  return [];
}

// Portaria, síndico e administrador registram comentários.
export const podeComentar = (perfil) => COMENTAM.includes(perfil);

/** Morador só enxerga os chamados que ele mesmo abriu. */
const veTodos = (s) => s.perfil !== 'MORADOR';
const filtroDe = (s) => (veTodos(s) ? {} : { solicitanteId: s.vinculoId });

// Texto da unidade do solicitante (portaria/admin não têm unidade).
const unidade = (c) =>
  c.unidade_numero ? `Apto ${c.unidade_numero} - Bloco ${c.bloco_nome}` : null;

// Converte a linha do banco no formato da tela, já com as mudanças de status permitidas a quem vê.
const paraTela = (session) => (c) => ({
  id: Number(c.id),
  titulo: c.titulo,
  descricao: c.descricao,
  urgencia: c.urgencia,
  status: c.status,
  categoriaId: Number(c.categoria_id),
  categoria: c.categoria,
  solicitante: c.solicitante,
  perfilSolicitante: c.perfil_solicitante,
  unidade: unidade(c),
  meu: String(c.solicitante_id) === String(session.vinculoId),
  criadoEm: c.criado_em,
  atualizadoEm: c.atualizado_em,
  resolvidoEm: c.resolvido_em,
  comentarios: c.comentarios ?? 0,
  transicoes: transicoesPermitidas(session.perfil, c.status),
  anexos: (c.anexos ?? []).map((x) => ({
    id: Number(x.id),
    nome: x.nome,
    mime: x.mime,
    tamanho: Number(x.tamanho),
  })),
});

// Lista de chamados visíveis para o perfil, com as categorias.
export async function listar(session) {
  const [chamados, categorias] = await Promise.all([
    chamadosRepo.listByCondominio(session.condominioId, filtroDe(session)),
    chamadosRepo.listCategorias(),
  ]);
  return {
    perfil: session.perfil,
    podeComentar: podeComentar(session.perfil),
    categorias: categorias.map((c) => ({ id: Number(c.id), nome: c.nome })),
    chamados: chamados.map(paraTela(session)),
  };
}

// Quantidade de chamados não resolvidos (Visão Geral).
export async function resumo(session) {
  return { abertos: await chamadosRepo.contarAbertos(session.condominioId, filtroDe(session)) };
}

/** Busca o chamado respeitando a visibilidade (morador recebe 404 nos dos outros). */
async function buscarVisivel(session, id) {
  const c = await chamadosRepo.findById(id, session.condominioId);
  if (!c || (!veTodos(session) && String(c.solicitante_id) !== String(session.vinculoId))) {
    throw new AppError(404, 'Chamado não encontrado.');
  }
  return c;
}

// Chamado com o histórico completo de acompanhamento.
export async function detalhar(session, id) {
  const c = await buscarVisivel(session, id);
  const historico = await chamadosRepo.listAcompanhamentos(c.id);
  return {
    chamado: paraTela(session)(c),
    podeComentar: podeComentar(session.perfil),
    historico: historico.map((h) => ({
      id: Number(h.id),
      autor: h.autor,
      perfil: h.perfil,
      novoStatus: h.novo_status,
      comentario: h.comentario,
      criadoEm: h.criado_em,
    })),
  };
}

// Valida a foto (tipo pelo conteúdo e tamanho) e prepara para gravar.
function prepararAnexo(arquivo) {
  if (!arquivo) return null;
  const { mime, erro } = validarAnexo(arquivo.nome, arquivo.conteudo);
  if (erro) throw new AppError(422, 'Dados inválidos.', { anexo: erro });
  return {
    nome: nomeSeguro(arquivo.nome),
    mime,
    tamanho: arquivo.conteudo.length,
    conteudo: arquivo.conteudo,
  };
}

// Abre o chamado com a unidade de quem pediu e a foto opcional.
export async function abrir(session, dados, arquivo) {
  if (!(await chamadosRepo.categoriaExiste(dados.categoriaId))) {
    throw new AppError(422, 'Dados inválidos.', { categoriaId: 'Categoria não encontrada.' });
  }
  const anexo = prepararAnexo(arquivo);
  return withTransaction(async (db) => {
    const { id } = await chamadosRepo.create(
      {
        ...dados,
        condominioId: session.condominioId,
        solicitanteId: session.vinculoId,
        unidadeId: session.unidadeId ?? null,
      },
      db,
    );
    if (anexo) await chamadosRepo.addAnexo(id, anexo, db);
    return { id: Number(id) };
  });
}

/** Troca o status conforme a tabela da RN.22; o comentário opcional vai no mesmo registro. */
export async function alterarStatus(session, id, { status, comentario }) {
  await withTransaction(async (db) => {
    const c = await chamadosRepo.lockStatus(id, session.condominioId, db);
    if (!c || (!veTodos(session) && String(c.solicitante_id) !== String(session.vinculoId))) {
      throw new AppError(404, 'Chamado não encontrado.');
    }
    if (c.status === status) {
      throw new AppError(409, `O chamado já está "${ROTULO[status]}".`);
    }
    if (!transicoesPermitidas(session.perfil, c.status).includes(status)) {
      throw new AppError(403, mensagemSemPermissao(session.perfil, status));
    }
    await chamadosRepo.updateStatus(c.id, status, db);
    await chamadosRepo.addAcompanhamento(
      c.id,
      { autorId: session.vinculoId, novoStatus: status, comentario: comentario || null },
      db,
    );
  });
}

// Mensagem de erro específica para cada caso proibido.
function mensagemSemPermissao(perfil, status) {
  if (perfil === 'MORADOR') return 'Somente a administração do condomínio altera o status.';
  if (status === 'RESOLVIDO') return 'Apenas o síndico pode marcar o chamado como resolvido.';
  if (perfil === 'PORTARIA') return 'A portaria só pode mover chamados de Aberto para Em análise.';
  return 'Você não pode alterar o status deste chamado.';
}

// Registra só um comentário (sem mudar o status).
export async function comentar(session, id, { comentario }) {
  if (!podeComentar(session.perfil)) {
    throw new AppError(403, 'Apenas a portaria e o síndico registram acompanhamentos.');
  }
  const c = await buscarVisivel(session, id);
  await withTransaction(async (db) => {
    await chamadosRepo.addAcompanhamento(c.id, { autorId: session.vinculoId, comentario }, db);
    await chamadosRepo.tocar(c.id, db);
  });
}

// Devolve a foto só para quem pode ver o chamado.
export async function baixarAnexo(session, chamadoId, anexoId) {
  const anexo = await chamadosRepo.findAnexo(chamadoId, anexoId, session.condominioId);
  if (
    !anexo?.conteudo ||
    (!veTodos(session) && String(anexo.solicitante_id) !== String(session.vinculoId))
  ) {
    throw new AppError(404, 'Anexo não encontrado.');
  }
  return anexo;
}
