import NextAuth from "next-auth";
// 1. Importação correta do Adapter e do Provider (Corrigindo "Cannot find name")
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import prisma from "./lib/prisma"; 

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Conecta o NextAuth ao seu banco de dados via Prisma
  adapter: PrismaAdapter(prisma),
  
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],

  // 💡 IMPORTANTE: Usamos JWT para a sessão ser compatível com o Middleware do Next.js
  session: {
    strategy: "jwt",
  },

  callbacks: {
    /**
     * Callback JWT: Executado sempre que um token JWT é criado ou atualizado.
     * Aqui garantimos que o ID do usuário do banco (Prisma) seja salvo no Token.
     */
    async jwt({ token, user }) {
      // No momento do login, o objeto 'user' contém os dados do banco
      if (user) {
        token.sub = user.id; // Armazenamos o ID do Prisma no campo 'sub' do token
      }
      return token;
    },

    /**
     * Callback Session: Controla o que é exposto para o cliente (pelo useSession).
     * Aqui pegamos o ID que salvamos no Token e injetamos no objeto da Sessão.
     */
    async session({ session, token }) {
      // Se tivermos o ID no token, passamos para a sessão do front-end
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },

  // Páginas personalizadas (opcional)
  pages: {
    signIn: "/login",
  },

  // Garante que o Auth.js confie no host da Vercel
  trustHost: true,
});