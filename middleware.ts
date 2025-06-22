// middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// Logger configurável (pode ser substituído por qualquer sistema de logging)
const logger = {
  error: (message: string, metadata?: Record<string, unknown>) => 
    console.error(`[Middleware Error] ${message}`, metadata),
  warn: (message: string, metadata?: Record<string, unknown>) => 
    console.warn(`[Middleware Warning] ${message}`, metadata),
  info: (message: string, metadata?: Record<string, unknown>) => 
    console.log(`[Middleware Info] ${message}`, metadata),
};

/**
 * Configurações do Middleware
 */

// Idiomas suportados pelo sistema (usando const assertion para type safety)
const SUPPORTED_LOCALES = ['pt', 'en', 'es'] as const;
type Locale = typeof SUPPORTED_LOCALES[number];
const DEFAULT_LOCALE: Locale = 'pt';

// Definição de tipos para rotas
type RouteCategory = 'public' | 'protected' | 'api';

// Mapeamento de rotas por categoria (mais escalável que Set)
const ROUTE_MAP: Record<RouteCategory, string[]> = {
  public: [
    'login',
    'auth/error',
    'auth/verify',
    'password-reset'
  ],
  protected: [
    'dashboard',
    'profile',
    'settings'
  ],
  api: [
    'api/tasks',
    'api/protected'
  ]
};

// Feature flags (para habilitar/desabilitar funcionalidades)
const FEATURE_FLAGS = {
  STRICT_SECURITY: true,
  ENHANCED_LOGGING: process.env.NODE_ENV !== 'production',
};

/**
 * Classe de erros customizados para o middleware
 */
class MiddlewareError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MiddlewareError';
  }
}

class AuthenticationError extends MiddlewareError {
  constructor(code: string, message: string, metadata?: Record<string, unknown>) {
    super(code, 401, message, metadata);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends MiddlewareError {
  constructor(code: string, message: string, metadata?: Record<string, unknown>) {
    super(code, 403, message, metadata);
    this.name = 'AuthorizationError';
  }
}

/**
 * Funções utilitárias
 */

// Verifica se um valor é um locale válido
function isValidLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

// Extrai o locale da URL ou retorna o padrão
function extractLocale(pathParts: string[]): Locale {
  const potentialLocale = pathParts[0];
  return isValidLocale(potentialLocale) ? potentialLocale : DEFAULT_LOCALE;
}

// Verifica se a rota pertence a uma categoria específica
function isRouteInCategory(path: string, category: RouteCategory): boolean {
  const routeSegment = path.split('/')[0];
  return ROUTE_MAP[category].some(route => 
    route === routeSegment || route.startsWith(`${routeSegment}/`)
  );
}

// Verifica se o token é inválido ou expirado
function isTokenInvalid(token: any): boolean {
  if (!token) return true;
  if (typeof token !== 'object') return false;
  
  // Token com erro específico
  if ('error' in token && token.error === 'RefreshAccessTokenError') return true;
  
  // Token expirado (se tivermos expiração)
  if ('exp' in token && typeof token.exp === 'number') {
    return token.exp < Math.floor(Date.now() / 1000);
  }
  
  return false;
}

// Cria headers de segurança padrão
function createSecurityHeaders(requestHeaders: Headers): Headers {
  const newHeaders = new Headers(requestHeaders);
  
  if (FEATURE_FLAGS.STRICT_SECURITY) {
    newHeaders.set('X-Content-Type-Options', 'nosniff');
    newHeaders.set('X-Frame-Options', 'DENY');
    newHeaders.set('X-XSS-Protection', '1; mode=block');
    newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
  
  return newHeaders;
}

// Redireciona para página de login com contexto
function redirectToLogin(
  request: NextRequest, 
  locale: Locale, 
  returnPath: string,
  error?: string
): NextResponse {
  const loginUrl = new URL(`/${locale}/login`, request.url);
  
  if (returnPath) {
    loginUrl.searchParams.set('callbackUrl', `/${locale}/${returnPath}`);
  }
  
  if (error) {
    loginUrl.searchParams.set('error', error);
  }
  
  if (FEATURE_FLAGS.ENHANCED_LOGGING) {
    logger.info(`Redirecting to login`, { returnPath, error });
  }
  
  return NextResponse.redirect(loginUrl);
}

// Função corrigida: Redireciona para login com erro específico
function redirectToLoginWithError(
  request: NextRequest,
  locale: Locale,
  returnPath: string,
  errorCode: string
): NextResponse {
  return redirectToLogin(request, locale, returnPath, errorCode);
}

// Cria resposta de erro JSON para APIs
function createJsonErrorResponse(
  error: MiddlewareError,
  requestHeaders: Headers
): NextResponse {
  logger.error(error.message, {
    code: error.code,
    status: error.statusCode,
    metadata: error.metadata
  });
  
  return NextResponse.json(
    { 
      error: error.code,
      message: error.message,
      ...(FEATURE_FLAGS.ENHANCED_LOGGING && { traceId: Date.now().toString(36) })
    },
    { 
      status: error.statusCode, 
      headers: createSecurityHeaders(requestHeaders) 
    }
  );
}

/**
 * Middleware principal
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const pathParts = pathname.split('/').filter(Boolean);
  
  try {
    // 1. Processamento inicial e extração do locale
    const locale = extractLocale(pathParts);
    const requestHeaders = createSecurityHeaders(request.headers);
    requestHeaders.set('x-locale', locale);
    
    // Remove o locale para análise da rota
    const routePath = pathParts.slice(
      isValidLocale(pathParts[0]) ? 1 : 0
    ).join('/');
    
    // 2. Verificação de autenticação para rotas relevantes
    const isPublicRoute = isRouteInCategory(routePath, 'public');
    const isProtectedRoute = isRouteInCategory(routePath, 'protected');
    const isApiRoute = isRouteInCategory(routePath, 'api');
    
    // Se não for rota pública ou protegida, continuar sem verificação
    if (!isPublicRoute && !isProtectedRoute && !isApiRoute) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    
    // 3. Obter token de autenticação
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
    });
    
    // 4. Lógica de redirecionamento e autenticação
    
    // Caso 1: Usuário autenticado tentando acessar rota pública
    if (token && isPublicRoute) {
      if (isTokenInvalid(token)) {
        return redirectToLoginWithError(request, locale, routePath, 'SessionExpired');
      }
      const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
      return NextResponse.redirect(dashboardUrl);
    }
    
    // Caso 2: Rota protegida sem autenticação ou com token inválido
    if ((isProtectedRoute || isApiRoute) && (!token || isTokenInvalid(token))) {
      if (isApiRoute) {
        return createJsonErrorResponse(
          new AuthenticationError(
            'Unauthorized',
            'Authentication required to access this resource',
            { route: routePath }
          ),
          requestHeaders
        );
      }
      return redirectToLogin(
        request, 
        locale, 
        routePath,
        isTokenInvalid(token) ? 'SessionExpired' : undefined
      );
    }
    
    // 5. Rotas válidas - continuar com a requisição
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    
    // Configurações adicionais para rotas protegidas
    if (isProtectedRoute || isApiRoute) {
      response.headers.set('Cache-Control', 'no-store, max-age=0');
      
      // Adiciona CORS headers para APIs se necessário
      if (isApiRoute) {
        response.headers.set('Access-Control-Allow-Origin', 
          process.env.ALLOWED_ORIGINS || request.headers.get('origin') || '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      }
    }
    
    return response;
    
  } catch (error) {
    // Tratamento de erros centralizado
    const locale = extractLocale(pathParts);
    
    if (error instanceof MiddlewareError) {
      if (isRouteInCategory(pathParts.join('/'), 'api')) {
        return createJsonErrorResponse(error, request.headers);
      }
      return redirectToLoginWithError(
        request, 
        locale, 
        pathParts.join('/'), 
        error.code
      );
    }
    
    logger.error('Unexpected middleware error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      path: pathname 
    });
    
    return NextResponse.redirect(
      new URL(`/${locale}/auth/error`, request.url), 
      { headers: createSecurityHeaders(request.headers) }
    );
  }
}

/**
 * Configuração do Middleware
 * Aplica a todas as rotas exceto arquivos estáticos e de imagem
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(svg|png|jpg|jpeg|gif|webp|woff2)$).*)',
  ],
};