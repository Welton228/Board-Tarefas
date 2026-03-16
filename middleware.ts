import NextAuth from "next-auth";
import { authConfig } from "./src/auth.config"; // ⬅️ IMPORTANTE: Importar da config leve
import { NextResponse } from "next/server";

/**
 * ⚙️ INICIALIZAÇÃO DO AUTH
 * Usamos a versão compatível com Edge para evitar o erro de limite de 1MB da Vercel.
 */
const { auth } = NextAuth(authConfig);

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

  // ✅ Usuário logado tentando acessar página de login -> Vai para Dashboard
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, nextUrl));
  }

  // ✅ Usuário NÃO logado acessando rota protegida (Exceto APIs) -> Vai para Login
  if (!isLoggedIn && isProtectedRoute && !isApiRoute) {
    const loginUrl = new URL(`/${currentLocale}/login`, nextUrl);
    // Preserva a URL original para redirecionar após o login bem-sucedido
    loginUrl.searchParams.set("callbackUrl", nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  // 4. CONTINUIDADE DA REQUISIÇÃO
  const response = NextResponse.next();
  
  // Injeta o locale nos headers (Útil para Server Components lerem o idioma)
  response.headers.set('x-locale', currentLocale); 
  
  return response;
});

/**
 * ⚙️ MATCHER (FILTRO DE EXECUÇÃO)
 * Protege o middleware de rodar em arquivos estáticos, economizando recursos.
 */
export const config = {
  matcher: [
    /*
     * Ignora arquivos de sistema e mídia:
     * - _next/static, _next/image, favicon.ico
     * - extensões de imagem comuns (svg, png, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};