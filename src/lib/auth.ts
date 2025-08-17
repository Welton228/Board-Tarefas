// lib/auth.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";

/**
 * Função utilitária para validar as variáveis de ambiente necessárias
 */
const getEnvVars = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const secret = process.env.NEXTAUTH_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("❌ GOOGLE_CLIENT_ID e/ou GOOGLE_CLIENT_SECRET não definidos no .env");
  }

  if (!secret || secret.length < 32) {
    throw new Error("❌ NEXTAUTH_SECRET inválido ou muito curto (mínimo 32 caracteres)");
  }

  return { clientId, clientSecret, secret };
};

const env = getEnvVars();

/**
 * Configuração do NextAuth
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: env.clientId,
      clientSecret: env.clientSecret,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline", // Garante refresh token
          response_type: "code",
          scope:
            "openid email profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
        },
      },
    }),
  ],

  session: {
    strategy: "jwt", // Sessão baseada em JWT (mais leve que banco)
    maxAge: 30 * 24 * 60 * 60, // 30 dias
    updateAge: 24 * 60 * 60, // Atualiza token a cada 24h
  },

  callbacks: {
    /**
     * Callback executado sempre que um JWT é criado/atualizado
     */
    async jwt({ token, account, user }) {
      // Primeiro login do usuário
      if (account && user) {
        return {
          ...token,
          id: user.id,
          name: user.name ?? undefined,   // ⬅️ corrigido
          email: user.email ?? undefined, // ⬅️ corrigido
          image: user.image ?? undefined, // ⬅️ corrigido
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: Date.now() + Number(account.expires_in) * 1000,
        };
      }

      // Token ainda válido → retorna como está
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Token expirado → tenta renovar
      return await refreshAccessToken(token);
    },

    /**
     * Callback que define os dados expostos na sessão
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name ?? undefined;   // ⬅️ corrigido
        session.user.email = token.email ?? undefined; // ⬅️ corrigido
        session.user.image = (token.image as string) ?? undefined; // ⬅️ corrigido
      }
      session.accessToken = token.accessToken;
      session.error = token.error;

      return session;
    },
  },

  pages: {
    signIn: "/login", // Página customizada de login
    error: "/auth/error", // Página customizada de erro
  },

  secret: env.secret,
  debug: process.env.NODE_ENV === "development",
  useSecureCookies: process.env.NODE_ENV === "production",
};

/**
 * Função responsável por renovar o access token usando o refresh token
 */
async function refreshAccessToken(token: any) {
  try {
    const url =
      "https://oauth2.googleapis.com/token?" +
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken!,
      });

    const response = await fetch(url, { method: "POST" });
    const refreshedTokens = await response.json();

    if (!response.ok) throw refreshedTokens;

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + Number(refreshedTokens.expires_in) * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("❌ Erro ao renovar o access token:", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}
