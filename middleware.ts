import { auth } from "@/src/auth"; 
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * ℹ️ CONFIGURAÇÕES DE NEGÓCIO
 */
const SUPPORTED_LOCALES = ['pt', 'en', 'es'] as const;
const DEFAULT_LOCALE = 'pt';
const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/settings'];

/**
 * 🛡️ MIDDLEWARE PROTEGIDO (Auth.js v5)
 */
export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // 1. GESTÃO DE LOCALIZAÇÃO (Locale)
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0] as any;
  const localeInUrl = SUPPORTED_LOCALES.includes(firstSegment) ? firstSegment : null;
  const currentLocale = localeInUrl || DEFAULT_LOCALE;

  // Caminho normalizado (ex: /pt/dashboard -> /dashboard)
  const cleanPath = localeInUrl ? `/${segments.slice(1).join('/')}` : pathname;

  // 2. ESTADO DE AUTENTICAÇÃO
  // Na v5, usamos o próprio 'req.auth' que o wrapper fornece
  const isLoggedIn = !!req.auth;

  // 3. MAPEAMENTO DE ROTAS
  const isProtectedRoute = PROTECTED_PREFIXES.some(prefix => cleanPath.startsWith(prefix));
  const isLoginPage = cleanPath === '/login';

  /**
   * 4. LÓGICA DE REDIRECIONAMENTO (Clean Code)
   */

  // Caso: Logado na página de Login -> Vai para Dashboard
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, nextUrl));
  }

  // Caso: Deslogado em área protegida -> Vai para Login
  if (!isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL(`/${currentLocale}/login`, nextUrl);
    // Preserva a URL que o usuário tentou acessar para redirecionar após o login
    loginUrl.searchParams.set("callbackUrl", nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  // 5. FINALIZAÇÃO: Configuração de Headers e Locale
  const response = NextResponse.next();
  response.headers.set('x-locale', currentLocale);
  
  return response;
});

/**
 * ⚙️ MATCHER OTIMIZADO
 */
export const config = {
  matcher: [
    // Foca apenas em páginas, ignorando arquivos estáticos e rotas de API internas
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};