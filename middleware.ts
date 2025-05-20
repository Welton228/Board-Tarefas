// middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

/**
 * Configurações do Middleware
 */

// Idiomas suportados pelo sistema
const SUPPORTED_LOCALES = ['pt', 'en', 'es'] as const;
type Locale = typeof SUPPORTED_LOCALES[number];
const DEFAULT_LOCALE: Locale = 'pt';

// Rotas públicas que não requerem autenticação
const PUBLIC_ROUTES = new Set([
  'login',
  'auth/error',
  'auth/verify',
  'password-reset'
]);

// Rotas protegidas que requerem autenticação
const PROTECTED_ROUTES = new Set([
  'dashboard',
  'profile',
  'settings',
  'api/tasks',
  'api/protected'
]);

// Rotas de API que devem retornar JSON em vez de redirecionamento
const API_ROUTES = new Set([
  'api/tasks',
  'api/protected'
]);

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);

  /**
   * 1. Tratamento de Localização
   */
  const pathParts = pathname.split('/').filter(Boolean);
  const locale = SUPPORTED_LOCALES.includes(pathParts[0] as Locale) 
    ? pathParts[0] as Locale 
    : DEFAULT_LOCALE;

  // Adiciona locale aos headers para uso nas rotas
  requestHeaders.set('x-locale', locale);

  /**
   * 2. Verificação de Autenticação
   */
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
    });

    // Remove o locale para análise da rota
    const routePath = pathParts.slice(
      SUPPORTED_LOCALES.includes(pathParts[0] as Locale) ? 1 : 0
    ).join('/');

    /**
     * 3. Lógica de Redirecionamento
     */

    // Caso 1: Usuário autenticado tentando acessar rota pública (login, etc)
    if (token && PUBLIC_ROUTES.has(routePath)) {
      const redirectUrl = new URL(`/${locale}/dashboard`, request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Caso 2: Rota protegida sem autenticação
    if (!token && isProtectedRoute(routePath)) {
      if (isApiRoute(routePath)) {
        return NextResponse.json(
          { error: 'Unauthorized' }, 
          { status: 401, headers: requestHeaders }
        );
      }
      return redirectToLogin(request, locale, routePath);
    }

    // Caso 3: Token de refresh inválido
    if (token && isInvalidToken(token) && isProtectedRoute(routePath)) {
      return redirectToLoginWithError(request, locale, 'SessionExpired');
    }

    /**
     * 4. Tratamento para rotas válidas
     */
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Desabilita cache para rotas protegidas
    if (isProtectedRoute(routePath)) {
      response.headers.set('Cache-Control', 'no-store, max-age=0');
    }

    return response;

  } catch (error) {
    console.error('[Middleware Error]', error);
    return redirectToErrorPage(request, locale);
  }
}

/**
 * Funções auxiliares
 */

// Verifica se a rota está protegida
function isProtectedRoute(path: string): boolean {
  return PROTECTED_ROUTES.has(path.split('/')[0]);
}

// Verifica se é uma rota de API
function isApiRoute(path: string): boolean {
  return path.startsWith('api/');
}

// Verifica se o token é inválido
function isInvalidToken(token: any): boolean {
  return typeof token === 'object' && 'error' in token && token.error === 'RefreshAccessTokenError';
}

// Redireciona para página de login
function redirectToLogin(request: NextRequest, locale: Locale, returnPath: string) {
  const loginUrl = new URL(`/${locale}/login`, request.url);
  loginUrl.searchParams.set('callbackUrl', `/${locale}/${returnPath}`);
  return NextResponse.redirect(loginUrl);
}

// Redireciona para login com erro específico
function redirectToLoginWithError(request: NextRequest, locale: Locale, error: string) {
  const loginUrl = new URL(`/${locale}/login`, request.url);
  loginUrl.searchParams.set('error', error);
  return NextResponse.redirect(loginUrl);
}

// Redireciona para página de erro
function redirectToErrorPage(request: NextRequest, locale: Locale) {
  return NextResponse.redirect(new URL(`/${locale}/auth/error`, request.url));
}

/**
 * Configuração do Middleware
 * Aplica a todas as rotas exceto arquivos estáticos e de imagem
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(svg|png|jpg|jpeg|gif|webp|woff2)$).*)',
  ],
};