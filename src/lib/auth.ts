// lib/auth.ts

import { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getToken as nextAuthGetToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

/**
 * Função para renovar o token de acesso do Google quando expira.
 * Usa o refresh token para obter um novo access token.
 */
const refreshAccessToken = async (token: any) => {
  try {
    console.log('[REFRESH TOKEN] Iniciando renovação do token...');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    });

    const data = await response.json();
    console.log('[REFRESH TOKEN RESPONSE]', data);

    if (!response.ok) throw data;

    return {
      ...token,
      accessToken: data.access_token,
      accessTokenExpires: Date.now() + data.expires_in * 1000,
      refreshToken: data.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error('[REFRESH TOKEN ERROR]', error);
    return { ...token, error: 'RefreshAccessTokenError' };
  }
};

/**
 * Configurações do NextAuth, incluindo:
 * - Provedor Google
 * - Sessões baseadas em JWT
 * - Callbacks personalizados
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          scope:
            'openid email profile https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        },
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
    updateAge: 24 * 60 * 60,   // Atualiza a sessão a cada 24h
  },

  callbacks: {
    async jwt({ token, account, user, trigger, session }) {
      if (trigger === 'update') {
        console.log('[JWT - UPDATE TRIGGER]', session.user);
        return { ...token, ...session.user };
      }

      if (account && user) {
        const firstLoginToken = {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000,
          id: user.id,
          error: undefined,
        };
        console.log('[JWT - FIRST LOGIN]', firstLoginToken);
        return firstLoginToken;
      }

      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        console.log('[JWT - VÁLIDO]', token);
        return token;
      }

      console.log('[JWT - EXPIROU, TENTANDO RENOVAR]');
      const refreshedToken = await refreshAccessToken(token);
      console.log('[JWT - RENOVADO]', refreshedToken);
      return refreshedToken;
    },

    async session({ session, token }) {
      session.error = token.error;
      session.accessToken = token.accessToken;
      session.user.id = token.id;

      console.log('[SESSION CALLBACK]', session);
      return session;
    },
  },

  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60,
      },
    },
  },

  pages: {
    signIn: '/login',
    error: '/auth/error',
  },

  secret: process.env.NEXTAUTH_SECRET!,
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Função auxiliar para obter o token do lado do servidor.
 * Compatível com App Router (NextRequest).
 */
export const getToken = async (req: NextRequest) => {
  const token = await nextAuthGetToken({
    req,
    secret: process.env.NEXTAUTH_SECRET!,
    secureCookie: process.env.NODE_ENV === 'production',
    raw: true, // Força a leitura correta do cookie no App Router
  });

  console.log('[GET TOKEN] =>', token);
  return token;
};
