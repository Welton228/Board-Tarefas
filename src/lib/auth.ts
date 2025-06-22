// lib/auth.ts

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";

/**
 * ✅ Função segura para validar e carregar variáveis de ambiente
 */
const getEnvVars = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const secret = process.env.NEXTAUTH_SECRET;

  // Validações críticas para evitar falhas silenciosas
  if (!clientId || !clientSecret) {
    throw new Error(
      "❌ GOOGLE_CLIENT_ID e/ou GOOGLE_CLIENT_SECRET não estão definidos no .env"
    );
  }

  if (!secret) {
    throw new Error("❌ NEXTAUTH_SECRET não está definido no .env");
  }

  if (secret.length < 32) {
    console.warn(
      "⚠️ NEXTAUTH_SECRET deve ter pelo menos 32 caracteres para segurança adequada."
    );
  }

  return { clientId, clientSecret, secret };
};

const env = getEnvVars();

/**
 * ✅ Configuração centralizada e robusta do NextAuth
 */
export const authOptions: NextAuthOptions = {
  // Usa o Prisma como adaptador para persistência no banco de dados
  adapter: PrismaAdapter(prisma),

  // Configuração dos provedores de autenticação
  providers: [
    GoogleProvider({
      clientId: env.clientId,
      clientSecret: env.clientSecret,
      authorization: {
        params: {
          prompt: "consent", // Solicita novo consentimento sempre
          access_type: "offline", // Permite refresh token
          response_type: "code",  // Fluxo seguro (PKCE)
          scope: "openid email profile", // Escopos mínimos recomendados
        },
      },
    }),
  ],

  // Estratégia de sessão via JWT para leveza e performance
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
    updateAge: 24 * 60 * 60,   // Atualiza token a cada 24h
  },

  // Manipulação segura dos dados de sessão e JWT
  callbacks: {
    /**
     * ✅ Manipula o JWT ao autenticar
     */
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
      }

      if (user) {
        token.id = user.id;
      }

      return token;
    },

    /**
     * ✅ Injeta o ID do usuário na sessão visível no frontend
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  // Páginas customizadas
  pages: {
    signIn: "/login",         // Página de login customizada
    error: "/auth/error",     // Página de erro customizada
  },

  // Segurança e ambiente
  secret: env.secret,
  debug: process.env.NODE_ENV === "development", // Apenas em dev
  useSecureCookies: process.env.NODE_ENV === "production", // HTTPS only em produção
};
