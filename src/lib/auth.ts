import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import type { JWT } from "next-auth/jwt";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error("As variáveis de ambiente do Google OAuth não foram encontradas.");
}

/**
 * Tenta obter um novo Access Token do Google usando o Refresh Token.
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    });

    const refreshedTokens = await response.json();
    if (!response.ok) throw refreshedTokens;

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Erro crítico ao renovar token do Google:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  /**
   * 1. ISOLAMENTO DO ADAPTER (O SEGREDO)
   * Deixamos o adapter comentado por enquanto. Isso faz o sistema parar de 
   * depender do banco de dados (PostgreSQL) para validar sua sessão a cada segundo.
   */
  // adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias de persistência
  },

  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account, user }) {
      // Login inicial
      if (account && user) {
        return {
          ...token,
          id: user.id,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: (account.expires_at ?? 0) * 1000,
        };
      }

      /**
       * 2. FOLGA NO TOKEN
       * Ajustei a verificação para 30 segundos (mais estável para evitar 
       * disparos excessivos de renovação).
       */
      const now = Date.now();
      const shouldRefresh = now > (token.accessTokenExpires as number) - 30 * 1000;

      if (!shouldRefresh) {
        return token;
      }

      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        // @ts-ignore
        session.error = token.error;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/auth/error",
  },

  /**
   * 3. SEGURANÇA E AMBIENTE
   * Garante que o sistema confie no host da Vercel através do AUTH_SECRET.
   */
  secret: process.env.AUTH_SECRET,
});