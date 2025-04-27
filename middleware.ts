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
    // Obtém o token de autenticação do usuário
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
      raw: false,
    });

    // Rota pública, onde o token não é necessário
    const publicRoutes = ['login', 'auth/error', ''];
    const currentPath = pathnameParts.slice(2).join('/');

    // Verifica se a rota atual é pública
    const isPublicRoute = publicRoutes.some(
      (route) => currentPath === route || currentPath.startsWith(route)
    );

    // Define rotas protegidas, que exigem autenticação
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
      'error' in token && // Verifica se o token é um objeto e contém a propriedade 'error'
      token.error === 'RefreshAccessTokenError'
    ) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('error', 'SessionExpired');
      return NextResponse.redirect(loginUrl);
    }

    // 🔒 Proteção de API: acesso negado a rotas de API protegidas sem token
    if (currentPath.startsWith('api/protected') && !token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rota protegida com token válido, prossegue com a execução
    if (isProtectedRoute) {
      const response = NextResponse.next();
      response.headers.set('Cache-Control', 'no-store, max-age=0');
      return response;
    }

    // Caso contrário, prossiga com a requisição
    return NextResponse.next();
  } catch (error) {
    // Em caso de erro, redireciona para uma página de erro
    console.error('[MIDDLEWARE ERROR]', error);
    return NextResponse.redirect(new URL(`/${locale}/auth/error`, request.url));
  }
}

// 🧭 Define onde o middleware será executado
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(svg|png|jpg|jpeg|gif|webp)$).*)', // Exclui as rotas de assets estáticos e imagens
  ],
};
