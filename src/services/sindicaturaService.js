import { withTransaction } from '@/lib/db';
import { AppError } from '@/lib/errors';
import * as vinculosRepo from '@/repositories/vinculosRepository';

/*
 * RN.04 / RN.06 (revisão da Sprint 3) — o síndico não se cadastra.
 * - O Administrador (conta raiz, criada na implantação) designa o síndico.
 * - O síndico atual pode transferir a função para outro morador.
 * - Só existe um síndico ativo por condomínio; quem deixa a função volta a ser
 *   morador da sua unidade (ou perde o acesso, se não tiver unidade).
 * - Quem muda de papel tem a sessão encerrada e entra de novo com o novo perfil.
 */
const PODEM_DESIGNAR = ['ADMIN', 'SINDICO'];

const unidade = (r) =>
  r?.unidade_numero ? `Apto ${r.unidade_numero} - Bloco ${r.bloco_nome}` : null;

export async function consultar(session) {
  if (!PODEM_DESIGNAR.includes(session.perfil)) throw new AppError(403, 'Acesso negado.');
  return withTransaction(async (db) => {
    const atual = await vinculosRepo.findSindicoAtivo(session.condominioId, db);
    const moradores = await vinculosRepo.listMoradoresAtivos(session.condominioId, db);
    return {
      perfil: session.perfil,
      sindico: atual
        ? { vinculoId: Number(atual.id), nome: atual.nome_completo, unidade: unidade(atual) }
        : null,
      candidatos: moradores.map((m) => ({
        vinculoId: Number(m.id),
        nome: m.nome_completo,
        unidade: unidade(m),
      })),
    };
  });
}

export async function designar(session, vinculoId) {
  if (!PODEM_DESIGNAR.includes(session.perfil)) throw new AppError(403, 'Acesso negado.');
  return withTransaction(async (db) => {
    const novo = await vinculosRepo.findMoradorAtivo(vinculoId, session.condominioId, db);
    if (!novo) throw new AppError(404, 'Morador não encontrado neste condomínio.');

    const atual = await vinculosRepo.findSindicoAtivo(session.condominioId, db);
    if (session.perfil === 'SINDICO' && String(atual?.id) !== String(session.vinculoId)) {
      throw new AppError(403, 'Apenas o síndico atual pode transferir a função.');
    }
    if (atual && String(atual.usuario_id) === String(novo.usuario_id)) {
      throw new AppError(422, 'Esta pessoa já é o síndico.');
    }

    // Primeiro rebaixa o atual (o índice só permite um síndico ativo)
    if (atual) {
      await vinculosRepo.alterarPapel(
        atual.id,
        atual.unidade_id ? { perfil: 'MORADOR', ativo: true } : { perfil: 'SINDICO', ativo: false },
        db,
      );
    }
    await vinculosRepo.alterarPapel(novo.id, { perfil: 'SINDICO', ativo: true }, db);
    return {
      sindico: novo.nome_completo,
      voceSaiu: session.perfil === 'SINDICO',
    };
  });
}
