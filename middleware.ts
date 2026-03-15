import { auth } from "@/src/auth"; 
import { NextResponse } from "next/server";

/**
 * ℹ️ CONFIGURAÇÕES DE NEGÓCIO
 */
const SUPPORTED_LOCALES = ['pt', 'en', 'es'] as const;
const DEFAULT_LOCALE = 'pt';

const PROTECTED_PREFIXES = [
  '/dashboard', 
  '/clientdashboard', 
  '/profile', 
  '/settings'
];

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // 1. TRATAMENTO DE LOCALIZAÇÃO (i18n)
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0] as any;
  const localeInUrl = SUPPORTED_LOCALES.includes(firstSegment) ? firstSegment : null;
  const currentLocale = localeInUrl || DEFAULT_LOCALE;

  const cleanPath = localeInUrl ? `/${segments.slice(1).join('/')}` : pathname;

  // 2. VERIFICAÇÃO DE ESTADO
  const isLoggedIn = !!req.auth;
  const isProtectedRoute = PROTECTED_PREFIXES.some(prefix => cleanPath.startsWith(prefix));
  const isLoginPage = cleanPath === '/login';
  const isApiRoute = pathname.startsWith('/api'); // Nova verificação

  /**
   * 3. LÓGICA DE REDIRECIONAMENTO
   * Importante: Não redirecionamos rotas de API, apenas rotas de página (Pages).
   */

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, nextUrl));
  }

  // Só redireciona para login se for uma ROTA DE PÁGINA protegida.
  // Rotas de API protegidas devem ser tratadas dentro do arquivo da própria API (retornando 401).
  if (!isLoggedIn && isProtectedRoute && !isApiRoute) {
    const loginUrl = new URL(`/${currentLocale}/login`, nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  // 4. CONTINUIDADE DA REQUISIÇÃO
  const response = NextResponse.next();
  response.headers.set('x-locale', currentLocale); 
  
  return response;
});

/**
 * ⚙️ MATCHER (FILTRO DE EXECUÇÃO)
 * Ajustado para permitir que o Auth.js processe as APIs, permitindo que o 
 * useSession e o auth() no lado do servidor funcionem perfeitamente.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};