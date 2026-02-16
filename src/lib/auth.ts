/**
 * =====================================================================
 * AUTH.JS (NextAuth v5) + Google + PrismaAdapter
 * =====================================================================
 *
 * Este arquivo agora usa o padrão oficial do App Router.
 *
 * Exporta:
 * - auth() → usado nas APIs protegidas
 * - handlers → usado na rota /api/auth
 * - signIn / signOut → helpers client/server
 * =====================================================================
 */

import NextAuth from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";

import type { Account } from "next-auth";
import type { JWT } from "next-auth/jwt";

// ─────────────────────────────────────────────────────────
// Variáveis de ambiente
// ─────────────────────────────────────────────────────────

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

const isProd = process.env.NODE_ENV === "production";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET!;

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

async function getRefreshTokenFromDB(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { refresh_token: true },
  });

  return account?.refresh_token ?? undefined;
}

function computeAccessTokenExpires(
  account?: Partial<Pick<Account, "expires_at">> & { expires_in?: number }
): number {
  if (account?.expires_at) return account.expires_at * 1000;
  return Date.now() + (account?.expires_in ?? 3600) * 1000;
}

async function refreshAccessToken(oldToken: JWT): Promise<JWT> {
  try {
    if (!oldToken.refreshToken) return { ...oldToken, error: "NoRefreshToken" };

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: oldToken.refreshToken as string,
      }),
    });

    const refreshed = await response.json();

    if (!response.ok) {
      return { ...oldToken, error: "RefreshAccessTokenError" };
    }

    return {
      ...oldToken,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
      refreshToken: refreshed.refresh_token ?? oldToken.refreshToken,
    };
  } catch {
    return { ...oldToken, error: "RefreshAccessTokenError" };
  }
}

// ─────────────────────────────────────────────────────────
// CONFIGURAÇÃO PRINCIPAL AUTH.JS v5
// ─────────────────────────────────────────────────────────

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          scope: GOOGLE_SCOPES,
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        const refreshToken =
          account.refresh_token ??
          token.refreshToken ??
          (await getRefreshTokenFromDB(user.id as string));

        return {
          ...token,
          id: user.id,
          accessToken: account.access_token,
          refreshToken,
          accessTokenExpires: computeAccessTokenExpires(account),
        };
      }

      if (Date.now() < (token.accessTokenExpires as number)) return token;

      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: NEXTAUTH_SECRET,
  debug: !isProd,
});
