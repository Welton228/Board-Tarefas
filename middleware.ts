import { auth } from "@/src/auth"; // Certifique-se de usar o caminho do arquivo simplificado que criamos
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * ℹ️ CONFIGURAÇÕES DE NEGÓCIO
 */
const SUPPORTED_LOCALES = ['pt', 'en', 'es'] as const;
const DEFAULT_LOCALE = 'pt';
const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/settings'];

/**
 * 🛡️ MIDDLEWARE PROTEGIDO
 */
export default auth((req: NextRequest & { auth?: any }) => {
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
  // O objeto 'req.auth' vem preenchido pelo wrapper do Auth.js v5
  const isLoggedIn = !!req.auth;

  // 3. MAPEAMENTO DE ROTAS
  const isProtectedRoute = PROTECTED_PREFIXES.some(prefix => cleanPath.startsWith(prefix));
  const isLoginPage = cleanPath === '/login';

  /**
   * 4. LÓGICA DE REDIRECIONAMENTO (Early Returns)
   */

  // Caso: Logado tentando ir para Login -> Vai para Dashboard
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, nextUrl));
  }

  // Caso: Deslogado tentando acessar área protegida -> Vai para Login
  if (!isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL(`/${currentLocale}/login`, nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  // 5. FINALIZAÇÃO: Configuração de Headers
  const response = NextResponse.next();
  response.headers.set('x-locale', currentLocale);
  
  return response;
});

/**
 * ⚙️ MATCHER OTIMIZADO
 */
export const config = {
  matcher: [
    // Ignora arquivos internos, estáticos e extensões comuns (png, jpg, etc)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};