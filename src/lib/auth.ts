import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import NextAuth from 'next-auth';

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
          scope: 'openid email profile https://www.googleapis.com/auth/userinfo.profile'
        }
      }
    })
  ],

  callbacks: {
    async jwt({ token, account, user, trigger, session }) {
      // Atualização do token quando o usuário é atualizado
      if (trigger === 'update') {
        return { ...token, ...session.user };
      }

      // Primeiro login - adiciona tokens e informações do usuário
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? 
            Math.floor(account.expires_at * 1000) : 
            Math.floor(Date.now() + 3600 * 1000),
          id: user.id,
          error: undefined
        };
      }

      // Verifica se o token está expirado
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Token expirado - tentar renovar
      try {
        return await refreshAccessToken(token);
      } catch (error) {
        console.error('Failed to refresh token:', error);
        return { ...token, error: 'RefreshAccessTokenError' };
      }
    },

    async session({ session, token }) {
      // Envia propriedades para a sessão do cliente
      if (token.error) {
        session.error = token.error;
      }
      
      if (token.accessToken) {
        session.accessToken = token.accessToken;
      }

      if (token.id) {
        session.user.id = token.id;
      }

      return session;
    }
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
    updateAge: 24 * 60 * 60 // 24 horas
  },

  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 // 30 dias
      }
    }
  },

  pages: {
    signIn: '/login',
    error: '/auth/error'
  },

  secret: process.env.NEXTAUTH_SECRET!,
  debug: process.env.NODE_ENV === 'development'
};

// Função para renovar token do Google
async function refreshAccessToken(token: any) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw data;
    }

    return {
      ...token,
      accessToken: data.access_token,
      accessTokenExpires: Date.now() + (data.expires_in * 1000),
      refreshToken: data.refresh_token ?? token.refreshToken,
      error: undefined
    };
  } catch (error) {
    console.error('Refresh token error:', error);
    throw error;
  }
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export default NextAuth(authOptions);