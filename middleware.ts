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

  // Normaliza o caminho para verificação (remove o locale se existir)
  const cleanPath = localeInUrl 
    ? `/${segments.slice(1).join('/')}` 
    : pathname === '/' ? '/' : pathname;

  // 2. VERIFICAÇÃO DE ESTADO
  const isLoggedIn = !!req.auth;
  const isProtectedRoute = PROTECTED_PREFIXES.some(prefix => cleanPath.startsWith(prefix));
  const isLoginPage = cleanPath === '/login' || cleanPath === '/signin';
  const isApiRoute = pathname.startsWith('/api');

  /**
   * 3. LÓGICA DE REDIRECIONAMENTO
   */

  // Se logado e tentar acessar login, vai para o dashboard
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, nextUrl));
  }

  // Se não logado e tentar acessar rota protegida (que não seja API)
  if (!isLoggedIn && isProtectedRoute && !isApiRoute) {
    const loginUrl = new URL(`/${currentLocale}/login`, nextUrl);
    // Salva a página que o usuário tentou acessar para voltar depois do login
    loginUrl.searchParams.set("callbackUrl", nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  // 4. CONTINUIDADE DA REQUISIÇÃO
  const response = NextResponse.next();
  
  // Injeta o locale nos headers para que Server Components possam ler facilmente
  response.headers.set('x-locale', currentLocale); 
  
  return response;
});

/**
 * ⚙️ MATCHER (FILTRO DE EXECUÇÃO)
 * Otimizado para ignorar arquivos estáticos e focar em rotas dinâmicas.
 */
export const config = {
  matcher: [
    /*
     * Ignora arquivos de sistema e mídia para não sobrecarregar o middleware:
     * - _next/static, _next/image, favicon.ico
     * - extensões de imagem comuns
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};