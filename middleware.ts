import { auth } from "@/src/auth"; 
import { NextResponse } from "next/server";

/**
 * ℹ️ CONFIGURAÇÕES DE NEGÓCIO E ROTAS
 * Centralizar as rotas aqui facilita a manutenção futura (Clean Code).
 */
const SUPPORTED_LOCALES = ['pt', 'en', 'es'] as const;
const DEFAULT_LOCALE = 'pt';

// Adicionamos '/clientdashboard' aqui para que o Middleware saiba que deve protegê-lo
const PROTECTED_PREFIXES = [
  '/dashboard', 
  '/clientdashboard', 
  '/profile', 
  '/settings'
];

/**
 * 🛡️ MIDDLEWARE DE AUTENTICAÇÃO (Auth.js v5)
 * O wrapper 'auth' injeta automaticamente a sessão no objeto 'req'.
 */
export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // 1. TRATAMENTO DE LOCALIZAÇÃO (i18n)
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0] as any;
  const localeInUrl = SUPPORTED_LOCALES.includes(firstSegment) ? firstSegment : null;
  const currentLocale = localeInUrl || DEFAULT_LOCALE;

  // Caminho sem o prefixo de idioma (ex: /pt/clientdashboard -> /clientdashboard)
  const cleanPath = localeInUrl ? `/${segments.slice(1).join('/')}` : pathname;

  // 2. VERIFICAÇÃO DE ESTADO
  const isLoggedIn = !!req.auth;
  const isProtectedRoute = PROTECTED_PREFIXES.some(prefix => cleanPath.startsWith(prefix));
  const isLoginPage = cleanPath === '/login';

  /**
   * 3. LÓGICA DE REDIRECIONAMENTO
   */

  // Regra: Se está logado e tenta ir para o Login, manda para o Dashboard
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, nextUrl));
  }

  // Regra: Se NÃO está logado e tenta acessar área protegida, manda para Login
  if (!isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL(`/${currentLocale}/login`, nextUrl);
    // Guarda a URL original para voltar para ela após o login bem-sucedido
    loginUrl.searchParams.set("callbackUrl", nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  // 4. CONTINUIDADE DA REQUISIÇÃO
  const response = NextResponse.next();
  response.headers.set('x-locale', currentLocale); // Útil para o Client Side saber o idioma
  
  return response;
});

/**
 * ⚙️ MATCHER (FILTRO DE EXECUÇÃO)
 * Define em quais rotas o Middleware deve rodar. 
 * Ignora arquivos estáticos e de sistema para não perder performance.
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};