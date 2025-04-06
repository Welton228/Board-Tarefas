// middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. Configuração do token com tratamento de erro
  let token;
  try {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
      cookieName: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token'
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.redirect(new URL('/auth/error', request.url));
  }

  const { pathname } = request.nextUrl;

  // 2. Definição de rotas
  const publicRoutes = ['/', '/login', '/auth/error', '/api/auth'];
  const protectedRoutes = [
    '/dashboard',
    '/dashboard/:path*',
    '/api/protected/:path*'
  ];
  const authRoutes = ['/login'];

  // 3. Verificação de rotas
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route.replace('/:path*', ''))
  );
  
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route.replace('/:path*', ''))
  );
  
  const isAuthRoute = authRoutes.includes(pathname);

  // 4. Lógica de redirecionamento
  if (isAuthRoute && token) {
    // Usuário autenticado tentando acessar login - redireciona para dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isProtectedRoute) {
    if (!token) {
      // Usuário não autenticado tentando acessar rota protegida
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verifica token expirado
    if (token.error === 'RefreshAccessTokenError') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'SessionExpired');
      return NextResponse.redirect(loginUrl);
    }
  }

  // 5. Tratamento para API routes
  if (pathname.startsWith('/api/protected') && !token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 6. Cache control para páginas protegidas
  if (isProtectedRoute) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, etc.
     * - auth routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|auth).*)',
  ],
};