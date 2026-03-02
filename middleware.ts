import { auth } from "@/src/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * ℹ️ CONFIGURAÇÕES DE NEGÓCIO
 */
const SUPPORTED_LOCALES = ['pt', 'en', 'es'] as const;
const DEFAULT_LOCALE = 'pt';
const PUBLIC_ROUTES = ['/', '/login', '/auth/error', '/auth/verify'];
const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/settings'];

/**
 * 🛡️ MIDDLEWARE
 * O parâmetro 'req' é tipado automaticamente pelo wrapper 'auth' 
 * se o seu lib/auth estiver exportando corretamente.
 * Caso o erro persista, usamos o tipo abaixo para forçar a detecção do 'auth'.
 */
export default auth((req: NextRequest & { auth: any }) => {
  const { nextUrl } = req;
  const { pathname } = nextUrl;

  // 1. GESTÃO DE LOCALIZAÇÃO (Locale)
  const segments = pathname.split('/').filter(Boolean);
  const localeInUrl = SUPPORTED_LOCALES.includes(segments[0] as any) ? segments[0] : null;
  const currentLocale = localeInUrl || DEFAULT_LOCALE;

  // Caminho normalizado sem o prefixo de idioma (ex: /pt/dashboard -> /dashboard)
  const cleanPath = localeInUrl ? `/${segments.slice(1).join('/')}` : pathname;

  // 2. ESTADO DE AUTENTICAÇÃO
  // Graças ao wrapper 'auth', o objeto 'req.auth' contém a sessão
  const isLoggedIn = !!req.auth;

  // 3. MAPEAMENTO DE ROTAS
  const isProtectedRoute = PROTECTED_PREFIXES.some(prefix => cleanPath.startsWith(prefix));
  const isLoginPage = cleanPath === '/login';

  /**
   * 4. LÓGICA DE REDIRECIONAMENTO (Clean Code Logic)
   */

  // Caso 1: Usuário autenticado tentando acessar a página de Login
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, nextUrl));
  }

  // Caso 2: Usuário não autenticado tentando acessar rotas protegidas
  if (!isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL(`/${currentLocale}/login`, nextUrl);
    
    // Salva a URL atual no callbackUrl para redirecionar o usuário após o login
    loginUrl.searchParams.set("callbackUrl", nextUrl.href);
    
    return NextResponse.redirect(loginUrl);
  }

  // 5. FINALIZAÇÃO: Injeção de Locale nos Headers
  const response = NextResponse.next();
  response.headers.set('x-locale', currentLocale);
  
  return response;
});

/**
 * ⚙️ CONFIGURAÇÃO DO MATCHER
 * Otimizado para ignorar APIs e arquivos estáticos, focando apenas em páginas.
 */
export const config = {
  matcher: [
    /*
     * Ignora rotas de API (_next/api), arquivos estáticos (_next/static),
     * otimização de imagens (_next/image) e arquivos com extensão (favicon, etc).
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};