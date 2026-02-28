import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import type { JWT } from "next-auth/jwt";

// --- CONSTANTES DE AMBIENTE ---
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error("As variáveis de ambiente do Google OAuth não foram encontradas.");
}

/**
 * 🔄 LÓGICA DE RENOVAÇÃO DE TOKEN (Refresh Token)
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
      // Define a nova expiração (em milissegundos)
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      // O Google pode ou não enviar um novo refresh_token
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Erro crítico ao renovar token do Google:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

/**
 * 🛡️ CONFIGURAÇÃO PRINCIPAL DO AUTH.JS
 */
export const { auth, handlers, signIn, signOut } = NextAuth({
  // 1. ADAPTER: Mantemos ativo para persistir o usuário, mas a sessão será JWT para evitar quedas.
  adapter: PrismaAdapter(prisma),

  // 2. ESTRATÉGIA DE SESSÃO: Usamos JWT para máxima estabilidade na Vercel.
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline", // Essencial para receber o refresh_token
          response_type: "code",
        },
      },
    }),
  ],

  callbacks: {
    /**
     * 🔑 CALLBACK JWT
     * Executado sempre que um token é criado ou verificado.
     */
    async jwt({ token, account, user }) {
      // Login inicial: popula o token com dados do provedor
      if (account && user) {
        return {
          ...token,
          id: user.id,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: (account.expires_at ?? 0) * 1000,
        };
      }

      // Verifica se o token ainda é válido (com folga de 60 segundos)
      const now = Date.now();
      const shouldRefresh = now > (token.accessTokenExpires as number) - 60 * 1000;

      if (!shouldRefresh) {
        return token;
      }

      // Token expirou, tenta renovar
      return refreshAccessToken(token);
    },

    /**
     * 👥 CALLBACK SESSION
     * Disponibiliza os dados do JWT para o Front-end (useSession).
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        // @ts-ignore: Adiciona o erro ao objeto de sessão para o front-end tratar
        session.error = token.error;
      }
      return session;
    },
  },

  // 3. PÁGINAS CUSTOMIZADAS
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },

  // 4. SEGURANÇA
  secret: process.env.AUTH_SECRET,
  
  // Nota: Removi a configuração manual de cookies. O Auth.js v5 gerencia 
  // automaticamente os nomes (__Secure-) com base no protocolo (HTTP/HTTPS).
});