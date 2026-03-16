import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter"; // 💡 Adicione esta linha
import prisma from "../src/lib/prisma"; // 💡 Certifique-se de que o caminho está correto

export const { handlers, auth, signIn, signOut } = NextAuth({
  // ✅ VITAL: Vincula o Auth.js ao seu banco de dados
  adapter: PrismaAdapter(prisma), 

  trustHost: true,

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  session: { 
    strategy: "jwt", // ✅ Mantemos JWT para performance na Vercel
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      // Quando o usuário faz login, o 'user' contém o ID do banco de dados
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
});