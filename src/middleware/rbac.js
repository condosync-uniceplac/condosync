/*
 * Regras de acesso por perfil (RBAC), avaliadas no middleware.js.
 * Base para RN.06/RN.08: ajuste as listas conforme os módulos forem implementados.
 * Mantenha este arquivo sem dependências de Node (roda no Edge Runtime).
 */

export const PERFIS = Object.freeze({
  MORADOR: 'MORADOR',
  PORTARIA: 'PORTARIA',
  SINDICO: 'SINDICO',
  ADMIN: 'ADMIN',
});

/** Rotas acessíveis sem login (prefixos). */
const PUBLIC_PREFIXES = [
  '/login',
  '/cadastro',
  '/esqueci-senha',
  '/redefinir-senha',
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/logout',
  '/api/condominios',
];

/** Páginas só para quem NÃO está logado (logado é mandado ao painel). */
const GUEST_ONLY = ['/login', '/cadastro', '/esqueci-senha', '/redefinir-senha'];

/** Prefixos restritos a perfis específicos; o que não estiver aqui exige apenas login. */
const RULES = [
  { prefix: '/admin', perfis: [PERFIS.SINDICO, PERFIS.ADMIN] },
  { prefix: '/api/admin', perfis: [PERFIS.SINDICO, PERFIS.ADMIN] },
  { prefix: '/portaria', perfis: [PERFIS.PORTARIA, PERFIS.SINDICO, PERFIS.ADMIN] },
];

const matches = (pathname, prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export const isPublic = (pathname) => PUBLIC_PREFIXES.some((p) => matches(pathname, p));
export const isGuestOnly = (pathname) => GUEST_ONLY.some((p) => matches(pathname, p));

/** Perfis permitidos para o caminho, ou null se qualquer usuário logado pode acessar. */
export function allowedPerfis(pathname) {
  return RULES.find((r) => matches(pathname, r.prefix))?.perfis ?? null;
}
