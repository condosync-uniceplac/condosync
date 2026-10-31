import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/auth';
import { allowedPerfis, isGuestOnly, isPublic } from '@/middleware/rbac';

/**
 * Proteção de rotas (autenticação + RBAC por perfil).
 * As rotas de API ainda revalidam a sessão via requireSession() — o middleware é
 * a primeira barreira, não a única.
 */
export async function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (session && isGuestOnly(pathname)) {
    return NextResponse.redirect(new URL('/painel', request.url));
  }
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  if (!session) {
    if (isApi) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    const login = new URL('/login', request.url);
    if (pathname !== '/') login.searchParams.set('next', pathname + search);
    const response = NextResponse.redirect(login);
    // Token inválido/expirado: limpa o cookie
    if (request.cookies.has(SESSION_COOKIE)) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  const perfis = allowedPerfis(pathname);
  if (perfis && !perfis.includes(session.perfil)) {
    if (isApi) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    return NextResponse.redirect(new URL('/painel?erro=acesso-negado', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Tudo, exceto arquivos estáticos do Next e imagens/favicons
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
