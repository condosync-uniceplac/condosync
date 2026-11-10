/**
 * Mural de avisos (RN.20).
 * Camada de regras de negócio (service): confere o perfil de quem pede, valida as regras
 * e chama os repositories. Os erros (AppError) viram a resposta HTTP na rota da API.
 */

import { withTransaction } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { nomeSeguro, validarAnexo } from '@/lib/anexos';
import * as avisosRepo from '@/repositories/avisosRepository';

/*
 * RN.20 (versão 2) — mural de avisos.
 * - Só o síndico (ou o administrador) publica, edita e remove avisos.
 * - Categoria e urgência são separadas (ex.: "Manutenção" + "Urgente").
 * - Cada usuário confirma a leitura; o mural mostra quantos já leram.
 * - Anexos (PDF/PNG/JPG até 2 MB) são baixados por rota autenticada (bug #19).
 */
export const PUBLICAM = ['SINDICO', 'ADMIN'];

// Barra quem não é síndico/administrador nas ações de publicação.
const exigirPublicador = (s) => {
  if (!PUBLICAM.includes(s.perfil)) {
    throw new AppError(403, 'Apenas o síndico pode publicar avisos.');
  }
};

// Converte a linha do banco no formato usado pela tela ("editado" = alterado 1 min após publicar).
const paraTela = (a) => ({
  id: Number(a.id),
  titulo: a.titulo,
  corpo: a.corpo,
  prioridade: a.prioridade,
  categoriaId: Number(a.categoria_id),
  categoria: a.categoria,
  autor: a.autor,
  publicadoEm: a.publicado_em,
  editado: new Date(a.atualizado_em) - new Date(a.publicado_em) > 60_000,
  lido: a.lido,
  leituras: a.leituras,
  anexos: (a.anexos ?? []).map((x) => ({
    id: Number(x.id),
    nome: x.nome,
    mime: x.mime,
    tamanho: Number(x.tamanho),
  })),
});

// Mural do condomínio + categorias + se o usuário pode publicar.
export async function listarMural(session, { categoriaId } = {}) {
  const [avisos, categorias] = await Promise.all([
    avisosRepo.listByCondominio(session.condominioId, session.sub, { categoriaId }),
    avisosRepo.listCategorias(),
  ]);
  return {
    podePublicar: PUBLICAM.includes(session.perfil),
    categorias: categorias.map((c) => ({ id: Number(c.id), nome: c.nome })),
    avisos: avisos.map(paraTela),
  };
}

// Quantidade de avisos não lidos (sino e menu).
export async function resumo(session) {
  return { naoLidos: await avisosRepo.contarNaoLidos(session.condominioId, session.sub) };
}

// A categoria escolhida precisa existir.
async function exigirCategoria(categoriaId) {
  if (!(await avisosRepo.categoriaExiste(categoriaId))) {
    throw new AppError(422, 'Dados inválidos.', { categoriaId: 'Categoria não encontrada.' });
  }
}

// Valida o arquivo (tipo pelo conteúdo e tamanho) e prepara para gravar.
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

// Publica o aviso com anexo opcional; quem publica já conta como leitor.
export async function publicar(session, dados, arquivo) {
  exigirPublicador(session);
  await exigirCategoria(dados.categoriaId);
  const anexo = prepararAnexo(arquivo);
  return withTransaction(async (db) => {
    const { id } = await avisosRepo.create(
      { ...dados, condominioId: session.condominioId, autorId: session.vinculoId },
      db,
    );
    if (anexo) await avisosRepo.addAnexo(id, anexo, db);
    // Quem publica já conta como leitor
    await avisosRepo.marcarLido(id, session.sub, db);
    return { id: Number(id) };
  });
}

/** Edita o texto; com `removerAnexo` ou um arquivo novo, troca o anexo. */
export async function editar(session, id, dados, arquivo, { removerAnexo = false } = {}) {
  exigirPublicador(session);
  const aviso = await avisosRepo.findById(id, session.condominioId);
  if (!aviso) throw new AppError(404, 'Aviso não encontrado.');
  await exigirCategoria(dados.categoriaId);
  const anexo = prepararAnexo(arquivo);
  await withTransaction(async (db) => {
    await avisosRepo.update(aviso.id, dados, db);
    if (anexo || removerAnexo) await avisosRepo.removeAnexos(aviso.id, db);
    if (anexo) await avisosRepo.addAnexo(aviso.id, anexo, db);
  });
}

// Remove o aviso do mural (só síndico/administrador).
export async function remover(session, id) {
  exigirPublicador(session);
  const aviso = await avisosRepo.findById(id, session.condominioId);
  if (!aviso) throw new AppError(404, 'Aviso não encontrado.');
  await avisosRepo.remove(aviso.id);
}

// Registra que o usuário leu o aviso.
export async function confirmarLeitura(session, id) {
  const aviso = await avisosRepo.findById(id, session.condominioId);
  if (!aviso) throw new AppError(404, 'Aviso não encontrado.');
  await avisosRepo.marcarLido(aviso.id, session.sub);
}

// Devolve o arquivo só se o aviso for do condomínio de quem pede (bug #19).
export async function baixarAnexo(session, avisoId, anexoId) {
  const anexo = await avisosRepo.findAnexo(avisoId, anexoId, session.condominioId);
  if (!anexo?.conteudo) throw new AppError(404, 'Anexo não encontrado.');
  return anexo;
}
