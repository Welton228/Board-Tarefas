// app/api/auth/[...nextauth]/route.ts

// ✅ Garante que esta rota rode no runtime Node.js (necessário para OAuth, cookies e Prisma).
// Em produção (Vercel), isso evita erros sutis quando o projeto tem outras rotas no Edge.
export const runtime = "nodejs";

// ✅ Evita qualquer tipo de cache nessa rota de autenticação.
// (Você também poderia usar `export const revalidate = 0`, mas `dynamic` cobre bem.)
export const dynamic = "force-dynamic";

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// ✅ Cria o handler do NextAuth usando as opções centralizadas em lib/auth.ts.
// Observação: no App Router, o import correto é de "next-auth" (não "next-auth/next").
const handler = NextAuth(authOptions);

// ✅ Exporta os métodos HTTP exigidos pelo App Router.
export { handler as GET, handler as POST };
