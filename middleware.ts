import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * CONFIGURAÇÕES DE LOCALIZAÇÃO E ROTAS
 * Centralizamos os caminhos para facilitar a manutenção futura.
 */
const SUPPORTED_LOCALES = ['pt', 'en', 'es'] as const;
type Locale = typeof SUPPORTED_LOCALES[number];
const DEFAULT_LOCALE: Locale = 'pt';

const ROUTES = {
  public: ['/login', '/auth/error', '/auth/verify'],
  protected: ['/dashboard', '/profile', '/settings'],
  apiPrefix: '/api'
};

/**
 * UTILS - FUNÇÕES AUXILIARES
 */

// Identifica o locale presente na URL
function getLocale(pathname: string): Locale {
  const firstSegment = pathname.split('/')[1];
  return SUPPORTED_LOCALES.includes(firstSegment as Locale) 
    ? (firstSegment as Locale) 
    : DEFAULT_LOCALE;
}

// Limpa o locale da URL para facilitar a comparação com o mapeamento de rotas
function getCleanPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (SUPPORTED_LOCALES.includes(segments[0] as Locale)) {
    return `/${segments.slice(1).join('/')}`;
  }
  return pathname === '/' ? '/' : pathname;
}

/**
 * MIDDLEWARE PRINCIPAL
 * O wrapper auth() injeta automaticamente a sessão no objeto 'req.auth'.
 * Tipamos 'req' para garantir que o TypeScript reconheça a propriedade 'auth'.
 */
export default auth((req: NextRequest & { auth: any }) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  
  // 1. Extração de estado e metadados
  const locale = getLocale(pathname);
  const cleanPath = getCleanPath(pathname);
  const isLoggedIn = !!req.auth; // Verifica se existe uma sessão válida

  // 2. Classificação da Rota Atual
  const isApiRoute = pathname.startsWith(ROUTES.apiPrefix);
  const isPublicRoute = ROUTES.public.some(route => cleanPath.startsWith(route));
  const isProtectedRoute = ROUTES.protected.some(route => cleanPath.startsWith(route));

  /**
   * 3. LÓGICA DE CONTROLE DE ACESSO (GUARDS)
   */

  // Regra 1: APIs não devem ser redirecionadas pelo middleware.
  // Deixamos que o próprio arquivo da API retorne 401 JSON se necessário.
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Regra 2: Se o usuário estiver LOGADO e tentar acessar rotas de login/públicas,
  // nós o enviamos diretamente para o dashboard.
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, nextUrl));
  }

  // Regra 3: Se o usuário NÃO estiver logado e tentar acessar uma rota protegida,
  // redirecionamos para o login salvando a URL de destino (callbackUrl).
  if (!isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL(`/${locale}/login`, nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  // Regra 4: Para todas as outras rotas (como a Landing Page), apenas prosseguimos.
  const response = NextResponse.next();
  
  // Adição de Headers de segurança e contexto de idioma
  response.headers.set('x-locale', locale);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');

  return response;
});

/**
 * MATCHER - FILTRO DE EXECUÇÃO
 * Define quais caminhos o middleware deve ignorar para economizar recursos.
 */
export const config = {
  matcher: [
    /*
     * Ignora arquivos estáticos (imagens, ícones, fontes) e caminhos internos do Next.js.
     * Executa em todas as rotas de página e API.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};