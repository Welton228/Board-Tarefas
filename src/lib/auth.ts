// lib/auth.ts
/**
 * NextAuth + Google + PrismaAdapter (Supabase/Postgres) — configuração robusta
 * ---------------------------------------------------------------------------------
 * Melhorias:
 * - Corrigida tipagem (string | null → string | undefined).
 * - Função computeAccessTokenExpires aceita "expires_in" opcional.
 * - Busca refresh_token no banco quando o Google não envia.
 * - Logs mais claros e seguros.
 */

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions, Account, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";

// ───────────────────────────────────────────────────────────────────────────────
// Constantes e variáveis de ambiente
// ───────────────────────────────────────────────────────────────────────────────

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

const isProd = process.env.NODE_ENV === "production";

function getEnv() {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
  const NEXTAUTH_URL = process.env.NEXTAUTH_URL;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("❌ GOOGLE_CLIENT_ID e/ou GOOGLE_CLIENT_SECRET não definidos no .env");
  }

  if (!NEXTAUTH_SECRET || NEXTAUTH_SECRET.length < 32) {
    throw new Error("❌ NEXTAUTH_SECRET inválido ou muito curto (mínimo 32 caracteres)");
  }

  if (isProd && !NEXTAUTH_URL) {
    console.warn(
      "⚠️ Recomenda-se definir NEXTAUTH_URL em produção para callbacks estáveis (ex.: https://seu-dominio.vercel.app)."
    );
  }

  return { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET, NEXTAUTH_URL };
}

const ENV = getEnv();

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Busca o refresh_token salvo no banco (tabela Account) caso o Google não o envie.
 */
async function getRefreshTokenFromDB(userId: string): Promise<string | undefined> {
  try {
    const account = await prisma.account.findFirst({
      where: { userId, provider: "google" },
      select: { refresh_token: true },
    });
    // Retorna sempre string | undefined (nunca null)
    return account?.refresh_token ?? undefined;
  } catch (err) {
    console.error("❌ Falha ao buscar refresh_token no banco:", err);
    return undefined;
  }
}

/**
 * Cálculo robusto do timestamp de expiração do access token.
 * Aceita "expires_at" (do DB) e "expires_in" (do callback inicial).
 */
function computeAccessTokenExpires(
  account?: Partial<Pick<Account, "expires_at">> & { expires_in?: number }
): number {
  const now = Date.now();

  if (account?.expires_at) {
    return account.expires_at * 1000; // segundos → ms
  }

  const seconds = typeof account?.expires_in === "number" ? account.expires_in : 3600; // fallback 1h
  return now + seconds * 1000;
}

/**
 * Renova o access token usando o refresh token do Google.
 */
async function refreshAccessToken(oldToken: JWT): Promise<JWT> {
  try {
    const refreshToken = (oldToken.refreshToken as string | undefined) ?? undefined;
    if (!refreshToken) {
      return { ...oldToken, error: "NoRefreshToken" };
    }

    const tokenUrl = "https://oauth2.googleapis.com/token";

    const body = new URLSearchParams({
      client_id: ENV.GOOGLE_CLIENT_ID,
      client_secret: ENV.GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const refreshed = await response.json();

    if (!response.ok) {
      console.error("❌ Erro do endpoint do Google ao renovar token:", refreshed);
      return { ...oldToken, error: "RefreshAccessTokenError" };
    }

    return {
      ...oldToken,
      accessToken: refreshed.access_token ?? (oldToken.accessToken as string | undefined),
      accessTokenExpires: Date.now() + (refreshed.expires_in ? refreshed.expires_in * 1000 : 3600 * 1000),
      refreshToken: refreshed.refresh_token ?? (oldToken.refreshToken as string | undefined),
      error: undefined,
    };
  } catch (error) {
    console.error("❌ Exceção ao renovar o access token:", error);
    return { ...oldToken, error: "RefreshAccessTokenError" };
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Configuração NextAuth
// ───────────────────────────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: ENV.GOOGLE_CLIENT_ID,
      clientSecret: ENV.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: GOOGLE_SCOPES,
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, account, user }): Promise<JWT> {
      // Primeiro login
      if (account && user) {
        const typedAccount = account as Account & { expires_in?: number };
        const typedUser = user as User;

        const refreshToken =
          typedAccount.refresh_token ??
          (token.refreshToken as string | undefined) ??
          (await getRefreshTokenFromDB(typedUser.id));

        return {
          ...token,
          id: typedUser.id,
          name: typedUser.name ?? token.name,
          email: typedUser.email ?? token.email,
          picture: typedUser.image ?? (token.picture as string | undefined),
          image: typedUser.image ?? (token.image as string | undefined),
          accessToken: typedAccount.access_token ?? (token.accessToken as string | undefined),
          refreshToken: refreshToken ?? undefined,
          accessTokenExpires: computeAccessTokenExpires(typedAccount),
        };
      }

      // Token válido ainda
      if (Date.now() < ((token.accessTokenExpires as number | undefined) ?? 0)) {
        return token;
      }

      // Expirado → tenta renovar
      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        session.user.name = (token.name as string | undefined) ?? session.user.name ?? undefined;
        session.user.email = (token.email as string | undefined) ?? session.user.email ?? undefined;
        session.user.image = (token.image as string | undefined) ?? session.user.image ?? undefined;
      }

      (session as any).accessToken = token.accessToken as string | undefined;
      (session as any).error = token.error as string | undefined;

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/auth/error",
  },

  /**
   * Segurança / Cookies:
   * - useSecureCookies em produção para marcar cookies como "Secure".
   */

  secret: ENV.NEXTAUTH_SECRET,
  debug: !isProd,
  useSecureCookies: isProd,

   /**
   * Events úteis para depuração (opcional; deixe comentado se não precisar de logs extras):
   */
  // events: {
  //   async signIn(message) {
  //     console.log("▶️ signIn event:", message);
  //   },
  //   async session(message) {
  //     console.log("▶️ session event:", message);
  //   },
  //   async error(error) {
  //     console.error("▶️ events.error:", error);
  //   },
  // },
};
