import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    // 🔐 Obtém o token JWT (raw = string JWT, não decodificado)
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
      raw: false, // <- trocamos para FALSE para ter acesso ao objeto decodificado
    });

    // 🟢 Rotas públicas (acessíveis sem login)
    const publicRoutes = ['/', '/login', '/auth/error'];
    const isPublicRoute = publicRoutes.some((route) =>
      pathname === route || pathname.startsWith(route)
    );

    // 🔴 Rotas protegidas (requerem autenticação)
    const isProtectedRoute =
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/api/protected');

    // ✅ Usuário logado tentando acessar /login → redireciona para /dashboard
    if (pathname === '/login' && token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // ❌ Rota protegida sem token → redireciona para login
    if (isProtectedRoute && !token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ⛔ Token com erro de renovação
    if (
      isProtectedRoute &&
      token &&
      typeof token === 'object' &&
      'error' in token &&
      token.error === 'RefreshAccessTokenError'
    ) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'SessionExpired');
      return NextResponse.redirect(loginUrl);
    }

    // 🔒 Rota de API protegida sem token → erro 401
    if (pathname.startsWith('/api/protected') && !token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🧠 Rota protegida com token → evita cache
    if (isProtectedRoute) {
      const response = NextResponse.next();
      response.headers.set('Cache-Control', 'no-store, max-age=0');
      return response;
    }

    // 👍 Continua normalmente para rotas públicas ou não protegidas
    return NextResponse.next();
  } catch (error) {
    console.error('[MIDDLEWARE ERROR]', error);
    return NextResponse.redirect(new URL('/auth/error', request.url));
  }
}

// 🧭 Define onde o middleware será executado
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(svg|png|jpg|jpeg|gif|webp)$|auth).*)',
  ],
};
