// middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// Idiomas suportados
const SUPPORTED_LOCALES = ['pt', 'en', 'es'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🔍 Detecta o locale da URL
  const pathnameParts = pathname.split('/');
  const locale = SUPPORTED_LOCALES.includes(pathnameParts[1]) ? pathnameParts[1] : 'pt';

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
      raw: false,
    });

    const publicRoutes = ['login', 'auth/error', ''];
    const currentPath = pathnameParts.slice(2).join('/');
    const isPublicRoute = publicRoutes.some(
      (route) => currentPath === route || currentPath.startsWith(route)
    );

    const isProtectedRoute =
      currentPath.startsWith('dashboard') ||
      currentPath.startsWith('api/tasks') ||
      currentPath.startsWith('api/protected');

    // ✅ Usuário logado tentando acessar /[locale]/login → redireciona para /[locale]/dashboard
    if (currentPath === 'login' && token) {
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }

    // ❌ Rota protegida sem token → redireciona para /[locale]/login
    if (isProtectedRoute && !token) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('callbackUrl', `/${locale}/${currentPath}`);
      return NextResponse.redirect(loginUrl);
    }

    // ⛔ Token expirado
    if (
      isProtectedRoute &&
      token &&
      typeof token === 'object' &&
      'error' in token &&
      token.error === 'RefreshAccessTokenError'
    ) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('error', 'SessionExpired');
      return NextResponse.redirect(loginUrl);
    }

    // 🔒 Proteção de API
    if (currentPath.startsWith('api/protected') && !token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isProtectedRoute) {
      const response = NextResponse.next();
      response.headers.set('Cache-Control', 'no-store, max-age=0');
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    console.error('[MIDDLEWARE ERROR]', error);
    return NextResponse.redirect(new URL(`/${locale}/auth/error`, request.url));
  }
}

// 🧭 Define onde o middleware será executado
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
