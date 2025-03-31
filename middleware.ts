import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Configuração do token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production"
  });

  const path = request.nextUrl.pathname;

  // Rotas protegidas
  const protectedRoutes = [
    '/dashboard',
    '/dashboard/:path*'
  ];

  // Verifica se a rota atual é protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    path.startsWith(route.replace('/:path*', ''))
  );

  // Redirecionamento se não autenticado
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/', request.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Configuração de rotas protegidas
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/protected/:path*'
  ],
};