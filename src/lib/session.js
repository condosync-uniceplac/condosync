import { cookies } from 'next/headers';
import { AppError } from './errors';
import { SESSION_COOKIE, verifySession } from './auth';

/** Sessão atual (payload do JWT) em Server Components e rotas de API, ou null. */
export async function getSession() {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Exige sessão e, opcionalmente, um dos perfis informados. */
export async function requireSession(perfis) {
  const session = await getSession();
  if (!session) throw new AppError(401, 'Não autenticado.');
  if (perfis && !perfis.includes(session.perfil)) throw new AppError(403, 'Acesso negado.');
  return session;
}
