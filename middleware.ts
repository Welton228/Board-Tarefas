import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    // Verifica o token de sessão
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Se o usuário NÃO estiver autenticado, redireciona para a home com a mensagem
    if (!token) {
        return NextResponse.redirect(new URL("/?message=Acesso negado! Faça login primeiro.", req.url));
    }

    return NextResponse.next(); // Permite o acesso caso o usuário esteja autenticado
}

// Configuração de rotas para proteger
export const config = {
    matcher: ["/dashboard/:path*"], // Protege todas as rotas dentro de /dashboard
};
