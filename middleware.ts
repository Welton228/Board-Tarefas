import { auth } from "@/src/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPPORTED_LOCALES = ['pt', 'en', 'es'] as const;
const DEFAULT_LOCALE = 'pt';

/**
 * 🛡️ MIDDLEWARE (Next.js 15)
 */
export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const { pathname } = nextUrl;
  
  // 1. GESTÃO DE LOCALIZAÇÃO (Locale)
  const segments = pathname.split('/').filter(Boolean);
  const localeInUrl = SUPPORTED_LOCALES.includes(segments[0] as any) ? segments[0] : null;
  const currentLocale = localeInUrl || DEFAULT_LOCALE;
  
  const cleanPath = localeInUrl 
    ? `/${segments.slice(1).join('/')}` 
    : pathname;

  // 2. EXCEÇÃO CRÍTICA (Evita o erro de build no /_not-found)
  // Ignora APIs, arquivos estáticos do Next e arquivos na pasta public
  if (
    pathname.startsWith('/api') || 
    pathname.startsWith('/_next') || 
    pathname.includes('.') // Pula arquivos como favicon.ico, logo.png, etc.
  ) {
    return NextResponse.next();
  }

  // 3. OBTENÇÃO DA SESSÃO PROTEGIDA
  // Envolvemos em try/catch para que o erro s.j2 não trave o build estático
  let session = null;
  try {
    session = await auth();
  } catch (error) {
    session = null;
  }
  const isLoggedIn = !!session;

  // 4. MAPEAMENTO DE ROTAS
  const PUBLIC_ROUTES = ['/', '/login', '/auth/error', '/auth/verify'];
  const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/settings'];

  const isPublicRoute = PUBLIC_ROUTES.some(route => cleanPath === route);
  const isProtectedRoute = PROTECTED_PREFIXES.some(prefix => cleanPath.startsWith(prefix));

  // 5. LÓGICA DE REDIRECIONAMENTO (O Coração do Sistema)

  // Caso: Logado tentando acessar Login
  if (isLoggedIn && cleanPath === '/login') {
    return NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, nextUrl));
  }

  // Caso: Deslogado tentando acessar Rota Protegida
  if (!isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL(`/${currentLocale}/login`, nextUrl);
    // Salva a URL para onde o usuário queria ir
    loginUrl.searchParams.set("callbackUrl", nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  // 6. FINALIZAÇÃO E INJEÇÃO DE LOCALE
  const response = NextResponse.next();
  response.headers.set('x-locale', currentLocale);
  
  return response;
}

/**
 * ⚙️ MATCHER OTIMIZADO
 */
export const config = {
  matcher: [
    /*
     * Matcher para capturar rotas de páginas e ignorar o resto
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};