/**
 * Middleware do Next.js: roda antes de toda requisição (páginas e API).
 * Decide se a pessoa pode acessar o caminho pedido, de acordo com o login e o perfil.
 */

import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/auth';
import { allowedPerfis, isGuestOnly, isPublic } from '@/middleware/rbac';

/**
 * Proteção de rotas (autenticação + RBAC por perfil).
 * As rotas de API ainda revalidam a sessão via requireSession() — o middleware é
 * a primeira barreira, não a única.
 */
export async function middleware(request) {
  // Caminho pedido e se é uma rota de API (resposta em JSON) ou de página (redirecionamento).
  const { pathname, search } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');
  // Lê e valida o cookie de sessão (JWT). Sem cookie ou inválido = null.
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  // Quem já está logado não precisa ver login/cadastro: vai para o painel.
  if (session && isGuestOnly(pathname)) {
    return NextResponse.redirect(new URL('/painel', request.url));
  }
  // Rotas públicas (login, cadastro, recuperação de senha...) passam direto.
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Sem login: API responde 401; página manda para o login guardando o destino em ?next.
  if (!session) {
    if (isApi) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    const login = new URL('/login', request.url);
    if (pathname !== '/') login.searchParams.set('next', pathname + search);
    const response = NextResponse.redirect(login);
    // Token inválido/expirado: limpa o cookie
    if (request.cookies.has(SESSION_COOKIE)) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  // Confere se o perfil da sessão pode acessar esse caminho (tabela em src/middleware/rbac.js).
  const perfis = allowedPerfis(pathname);
  if (perfis && !perfis.includes(session.perfil)) {
    if (isApi) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    return NextResponse.redirect(new URL('/painel?erro=acesso-negado', request.url));
  }

  return NextResponse.next();
}

// Em quais caminhos o middleware roda.
export const config = {
  // Tudo, exceto arquivos estáticos do Next e imagens/favicons
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
