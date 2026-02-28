import { auth } from "@/src/auth"; // ✅ Importação correta do executor auth
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Configurações de Internacionalização (Locales)
const SUPPORTED_LOCALES = ['pt', 'en', 'es'] as const;
const DEFAULT_LOCALE = 'pt';

/**
 * 🛡️ MIDDLEWARE DE AUTENTICAÇÃO E LOCALIZAÇÃO
 * Utiliza a função auth() como wrapper para ter acesso à sessão em tempo real.
 */
export default auth((req: NextRequest & { auth: any }) => {
  const { nextUrl } = req;
  const { pathname } = nextUrl;
  
  // 1. GESTÃO DE LOCALIZAÇÃO (Locale)
  const segments = pathname.split('/').filter(Boolean);
  const localeInUrl = SUPPORTED_LOCALES.includes(segments[0] as any) ? segments[0] : null;
  const currentLocale = localeInUrl || DEFAULT_LOCALE;
  
  // Caminho limpo sem o prefixo de idioma (ex: /pt/dashboard -> /dashboard)
  const cleanPath = localeInUrl 
    ? `/${segments.slice(1).join('/')}` 
    : pathname === '/' ? '/' : pathname;

  // Estado de autenticação derivado do Auth.js v5
  const isLoggedIn = !!req.auth;

  // 2. EXCEÇÃO CRÍTICA PARA APIS E ESTÁTICOS
  // Não interferimos em rotas de API para evitar quebras no Auth.js ou respostas 302 em chamadas JSON
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 3. MAPEAMENTO DE ROTAS
  // Adicionamos a home '/' como pública para evitar expulsar usuários não logados da landing page
  const PUBLIC_ROUTES = ['/', '/login', '/auth/error', '/auth/verify'];
  const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/settings'];

  const isPublicRoute = PUBLIC_ROUTES.some(route => cleanPath === route || cleanPath.startsWith('/login'));
  const isProtectedRoute = PROTECTED_PREFIXES.some(prefix => cleanPath.startsWith(prefix));

  // 4. LÓGICA DE REDIRECIONAMENTO (O Coração do Middleware)

  // Cenário A: Usuário logado tentando acessar página de Login
  if (isLoggedIn && cleanPath.startsWith('/login')) {
    const dashboardUrl = new URL(`/${currentLocale}/dashboard`, nextUrl);
    return NextResponse.redirect(dashboardUrl);
  }

  // Cenário B: Usuário deslogado tentando acessar rota protegida
  if (!isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL(`/${currentLocale}/login`, nextUrl);
    
    // Preserva a URL pretendida para redirecionar após o login bem-sucedido
    loginUrl.searchParams.set("callbackUrl", nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  // 5. FINALIZAÇÃO DA REQUISIÇÃO
  const response = NextResponse.next();
  
  // Injeta o locale nos headers para que Server Components possam ler facilmente
  response.headers.set('x-locale', currentLocale);
  
  return response;
});

/**
 * ⚙️ MATCHER CONFIG
 * Define quais caminhos o middleware deve observar.
 */
export const config = {
  matcher: [
    /*
     * Matcher otimizado para Next.js 15:
     * - Ignora arquivos estáticos (_next/static, _next/image)
     * - Ignora arquivos na pasta public (favicon, imagens, etc)
     * - Monitora todas as outras rotas
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};