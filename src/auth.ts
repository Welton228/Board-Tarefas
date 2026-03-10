import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * 🔐 CONFIGURAÇÃO CENTRAL DE AUTENTICAÇÃO (Auth.js v5)
 * Este arquivo deve ser importado tanto no Middleware quanto nas API Routes.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // ✅ CORREÇÃO 1: TrustHost forçado para evitar 401 em ambiente de produção (Vercel)
  trustHost: true,

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Garante que o Google sempre envie as informações necessárias
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  // ✅ CORREÇÃO 2: Estratégia JWT é mandatória para evitar logouts por latência de banco de dados
  // Se você usa Prisma, o adapter pode ser mantido, mas a session DEVE ser "jwt".
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias de persistência
  },

  callbacks: {
    /**
     * 🕒 Ajuste de 'Clock Skew' (Folga no Token)
     * Adicionamos uma margem de segurança para que o token não expire 
     * por diferença de milissegundos entre o servidor do Google e a Vercel.
     */
    async jwt({ token, account, user }) {
      if (account && user) {
        return {
          ...token,
          id: user.id,
          // ✅ CORREÇÃO 3: Folga de 30 segundos no tempo de expiração
          expires_at: (account.expires_at ?? 0) + 30, 
        };
      }
      return token;
    },

    /**
     * Sincroniza os dados do Token com a Sessão acessível no Frontend/Backend
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  // ✅ CORREÇÃO 4: Define a rota de login personalizada para o Middleware saber para onde levar o user
  pages: {
    signIn: "/login",
    error: "/login", // Redireciona para login em caso de erro de auth
  },
});