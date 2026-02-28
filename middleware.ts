import { auth } from "@/src/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPPORTED_LOCALES = ['pt', 'en', 'es'] as const;
const DEFAULT_LOCALE = 'pt';

/**
 * 🛡️ MIDDLEWARE PRINCIPAL
 */
export default auth((req: NextRequest & { auth: any }) => {
  const { nextUrl } = req;
  const { pathname } = nextUrl;
  
  // 1. Identificação do Locale e Path Limpo
  const segments = pathname.split('/').filter(Boolean);
  const localeInUrl = SUPPORTED_LOCALES.includes(segments[0] as any) ? segments[0] : null;
  const currentLocale = localeInUrl || DEFAULT_LOCALE;
  
  // Remove o locale do path para comparação (ex: /pt/dashboard -> /dashboard)
  const cleanPath = localeInUrl 
    ? `/${segments.slice(1).join('/')}` 
    : pathname;

  const isLoggedIn = !!req.auth;

  // 2. EXCEÇÃO CRÍTICA: Ignorar TODAS as rotas de API
  // O Auth.js v5 gerencia internamente /api/auth. 
  // Outras APIs devem responder 401 via código, não redirecionar para /login.
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 3. Definição de Rotas
  const isPublicRoute = ['/login', '/auth/error', '/auth/verify'].some(route => cleanPath.startsWith(route));
  const isProtectedRoute = ['/dashboard', '/profile', '/settings'].some(route => cleanPath.startsWith(route));

  // 4. LÓGICA DE REDIRECIONAMENTO

  // Regra A: Se estiver logado e tentar ir para Login, vai para o Dashboard
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, nextUrl));
  }

  // Regra B: Se NÃO estiver logado e for rota protegida, vai para Login
  if (!isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL(`/${currentLocale}/login`, nextUrl);
    // Evita loop de redirecionamento salvando a URL original
    loginUrl.searchParams.set("callbackUrl", nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Adição de Headers e Prosseguimento
  const response = NextResponse.next();
  response.headers.set('x-locale', currentLocale);
  
  return response;
});

/**
 * MATCHER ATUALIZADO
 * No Next.js 15, o matcher deve ser o mais limpo possível.
 */
export const config = {
  matcher: [
    /*
     * Captura tudo exceto:
     * - api (deixamos passar para não quebrar o Auth.js)
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico e arquivos públicos (png, jpg, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};