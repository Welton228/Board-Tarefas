import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";

/**
 * Configuração completa do NextAuth com:
 * - Provider Google
 * - Callbacks para session e jwt
 * - Tratamento de tokens
 */
export const authOptions: NextAuthOptions = {
  // Configuração do provedor Google
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],

  // Chave secreta única para toda a aplicação
  secret: process.env.NEXTAUTH_SECRET,

  // Configuração de sessão
  session: {
    strategy: "jwt", // Usa JWT ao invés de sessão de banco de dados
    maxAge: 30 * 24 * 60 * 60, // 30 dias de duração
  },

  // Callbacks para manipulação de tokens e sessões
  callbacks: {
    async jwt({ token, user, account }) {
      // 1. Adiciona access_token do provedor ao token JWT
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }

      // 2. Adiciona ID do usuário ao token
      if (user) {
        token.id = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      // 3. Passa todos os dados necessários para a sessão
      session.user.id = token.id as string;
      session.accessToken = token.accessToken as string;
      return session;
    },
  },

  // Páginas customizadas (opcional)
  pages: {
    signIn: "/login", // Rota de login customizada
    error: "/auth/error", // Rota para erros
  },
};

// Exporta os handlers para rotas de API
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };