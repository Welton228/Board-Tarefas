// lib/auth.ts

import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getToken as nextAuthGetToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/**
 * Função para renovar o token de acesso do Google usando o refresh token.
 */
const refreshAccessToken = async (token: any) => {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) throw data;

    return {
      ...token,
      accessToken: data.access_token,
      accessTokenExpires: Date.now() + data.expires_in * 1000,
      refreshToken: data.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error("[REFRESH TOKEN ERROR]", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
};

/**
 * Configurações do NextAuth.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope:
            "openid email profile https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
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
    async jwt({ token, account, user, trigger, session }) {
      if (trigger === "update" && session?.user) {
        return {
          ...token,
          name: session.user.name,
          email: session.user.email,
          picture: session.user.image,
        };
      }

      if (account && user) {
        return {
          ...token,
          id: user.id,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000,
          error: undefined,
        };
      }

      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.accessToken = token.accessToken as string;
        session.error = token.error;
      }
      return session;
    },
  },

  cookies: {
    sessionToken: {
      name: `${
        process.env.NODE_ENV === "production" ? "__Secure-" : ""
      }next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60,
      },
    },
  },

  pages: {
    signIn: "/login",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET!,
  debug: process.env.NEXTAUTH_DEBUG === "true",
};

/**
 * Tipagem do token com os campos personalizados.
 */
interface DecodedToken {
  id?: string;
  email?: string;
  name?: string;
  picture?: string;
  accessToken?: string;
  accessTokenExpires?: number;
  refreshToken?: string;
  error?: string;
  [key: string]: any;
}

/**
 * Função auxiliar para obter o token no App Router via NextRequest.
 */
export const getToken = async (
  req: NextRequest
): Promise<DecodedToken | null> => {
  const token = await nextAuthGetToken({
    req,
    secret: process.env.NEXTAUTH_SECRET!,
    secureCookie: process.env.NODE_ENV === "production",
    raw: false, // ← IMPORTANTE! Retorna um objeto decodificado
  });

  return token as DecodedToken | null;
};
