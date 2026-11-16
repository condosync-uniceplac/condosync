/**
 * Página "Meu perfil": ver os próprios dados, atualizar o telefone e trocar a senha.
 * Camada de regras de negócio (service): confere o perfil de quem pede, valida as regras
 * e chama os repositories. Os erros (AppError) viram a resposta HTTP na rota da API.
 */

import { withTransaction } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { formatTelefone, mascararDocumento } from '@/lib/masks';
import { hashPassword, verifyPassword } from '@/lib/password';
import * as condominiosRepo from '@/repositories/condominiosRepository';
import * as usuariosRepo from '@/repositories/usuariosRepository';
import * as vinculosRepo from '@/repositories/vinculosRepository';

const PERFIL_LABEL = {
  MORADOR: 'Morador',
  PORTARIA: 'Portaria',
  SINDICO: 'Síndico',
  ADMIN: 'Administrador',
};

/** Dados da própria pessoa; o CPF vai mascarado e nada de senha. */
export async function obter(session) {
  const u = await usuariosRepo.findPerfil(session.sub);
  if (!u) throw new AppError(404, 'Usuário não encontrado.');
  const unidade = session.unidadeId ? await condominiosRepo.findUnidade(session.unidadeId) : null;
  return {
    nome: u.nome_completo,
    email: u.email,
    telefone: formatTelefone(u.telefone),
    cpf: mascararDocumento('CPF', u.cpf),
    dataNascimento: u.data_nascimento,
    membroDesde: u.criado_em,
    perfil: PERFIL_LABEL[session.perfil] ?? session.perfil,
    condominio: session.condominioNome ?? null,
    unidade: unidade ? `Apto ${unidade.numero} - Bloco ${unidade.bloco}` : null,
  };
}

/** Atualiza o telefone de contato (a portaria usa para falar com quem reservou). */
export async function atualizarTelefone(session, { telefone }) {
  await usuariosRepo.atualizarTelefone(session.sub, telefone);
  return { telefone: formatTelefone(telefone) };
}

/**
 * Troca a senha conferindo a atual. Depois, todas as sessões da pessoa (outros
 * computadores e celulares) deixam de valer; a rota renova só a sessão atual.
 * Devolve a nova versão de sessão do vínculo em uso.
 */
export async function trocarSenha(session, { senhaAtual, novaSenha }) {
  const hashAtual = await usuariosRepo.findSenhaHash(session.sub);
  if (!hashAtual || !(await verifyPassword(senhaAtual, hashAtual))) {
    throw new AppError(422, 'Dados inválidos.', { senhaAtual: 'Senha atual incorreta.' });
  }
  if (await verifyPassword(novaSenha, hashAtual)) {
    throw new AppError(422, 'Dados inválidos.', {
      novaSenha: 'A nova senha deve ser diferente da atual.',
    });
  }
  const novoHash = await hashPassword(novaSenha);
  return withTransaction(async (db) => {
    await usuariosRepo.atualizarSenha(session.sub, novoHash, db);
    const versoes = await vinculosRepo.derrubarSessoesDoUsuario(session.sub, db);
    const atual = versoes.find((v) => String(v.id) === String(session.vinculoId));
    return { sv: atual?.sessao_versao ?? 0 };
  });
}
