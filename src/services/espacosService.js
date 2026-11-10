import { AppError } from '@/lib/errors';
import * as espacosRepo from '@/repositories/espacosRepository';

/*
 * RF.09 (Sprint 3) — o síndico cadastra, edita e desativa os espaços de reserva.
 * - Nome único no condomínio; capacidade a partir de 1 pessoa; valor a partir de R$ 0.
 * - Desativar tira o espaço da tela de reservas, mas as reservas já feitas continuam
 *   valendo e o histórico é mantido (espaços nunca são apagados).
 */
export const GESTAO = ['SINDICO', 'ADMIN'];

const exigirGestao = (s) => {
  if (!GESTAO.includes(s.perfil)) throw new AppError(403, 'Acesso negado.');
};

const paraTela = (e) => ({
  id: Number(e.id),
  nome: e.nome,
  descricao: e.descricao ?? '',
  capacidade: e.capacidade_pessoas,
  valor: Number(e.valor),
  ativo: e.ativo,
  reservasFuturas: e.reservas_futuras ?? 0,
});

async function nomeLivre(session, nome, ignorarId) {
  if (await espacosRepo.existeNome(session.condominioId, nome, ignorarId)) {
    throw new AppError(409, 'Já existe um espaço com este nome no condomínio.');
  }
}

export async function listar(session) {
  exigirGestao(session);
  return (await espacosRepo.listTodos(session.condominioId)).map(paraTela);
}

export async function criar(session, dados) {
  exigirGestao(session);
  await nomeLivre(session, dados.nome);
  const { id } = await espacosRepo.create(session.condominioId, dados);
  return { id: Number(id) };
}

export async function editar(session, id, dados) {
  exigirGestao(session);
  const espaco = await espacosRepo.findById(id, session.condominioId);
  if (!espaco) throw new AppError(404, 'Espaço não encontrado.');
  await nomeLivre(session, dados.nome, espaco.id);
  await espacosRepo.update(espaco.id, dados);
}
