import { cookies } from 'next/headers';
import { AppError } from './errors';
import { SESSION_COOKIE, verifySession } from './auth';
import * as vinculosRepo from '@/repositories/vinculosRepository';

export const SESSAO_EXPIRADA = 'Sua sessão expirou. Entre novamente.';

/** Payload do JWT, sem consultar o banco (use só para exibição). */
export async function getSession() {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/**
 * Sessão conferida com o banco: o vínculo precisa continuar ativo, com o mesmo perfil
 * e a mesma versão. Quando o síndico/administrador troca o papel de alguém,
 * a versão muda e a sessão antiga deixa de valer.
 */
export async function getValidSession() {
  const session = await getSession();
  if (!session?.vinculoId) return null;
  const estado = await vinculosRepo.findEstadoSessao(session.vinculoId);
  if (
    !estado ||
    !estado.ativo ||
    !estado.usuario_ativo ||
    estado.perfil !== session.perfil ||
    estado.sessao_versao !== (session.sv ?? 0)
  ) {
    return null;
  }
  return session;
}

/** Exige sessão válida e, opcionalmente, um dos perfis informados. */
export async function requireSession(perfis) {
  const token = await getSession();
  if (!token) throw new AppError(401, 'Não autenticado.');
  const session = await getValidSession();
  if (!session) throw new AppError(401, SESSAO_EXPIRADA);
  if (perfis && !perfis.includes(session.perfil)) throw new AppError(403, 'Acesso negado.');
  return session;
}
