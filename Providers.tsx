import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";

/**
 * Configuração completa do NextAuth com:
 * - Provider Google
 * - Callbacks para session e jwt
 * - Tratamento de tokens
 * - Renovação automática de token
 * - Tipagem estendida
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
          response_type: "code",
          scope: "openid email profile"
        }
      }
    })
  ],

  // Chave secreta única para toda a aplicação
  secret: process.env.NEXTAUTH_SECRET,

  // Configuração de sessão
  session: {
    strategy: "jwt", // Usa JWT ao invés de sessão de banco de dados
    maxAge: 30 * 24 * 60 * 60, // 30 dias de duração
    updateAge: 24 * 60 * 60 // Atualiza a sessão a cada 24 horas
  },

  // Configuração de cookies (importante para produção)
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

  // Callbacks para manipulação de tokens e sessões
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Atualização do token quando solicitado
      if (trigger === 'update') {
        return { ...token, ...session.user };
      }

      // Primeiro login - adiciona tokens do provedor
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? 
            account.expires_at * 1000 : 
            Date.now() + 3600 * 1000, // 1 hora padrão
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image
          }
        };
      }

      // Verifica se o token ainda é válido
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Token expirado - tentar renovar
      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      // Passa todos os dados necessários para a sessão
      session.user = {
        ...session.user,
        id: token.user?.id || token.sub || '',
        name: token.user?.name || session.user.name,
        email: token.user?.email || session.user.email,
        image: token.user?.image || session.user.image
      };
      
      session.accessToken = token.accessToken as string;
      session.error = token.error as string | undefined;
      
      return session;
    }
  },

  // Páginas customizadas
  pages: {
    signIn: "/login",
    error: "/auth/error",
    signOut: "/logout"
  },

  // Debug em desenvolvimento
  debug: process.env.NODE_ENV === "development"
};

// Função para renovar o token de acesso
async function refreshAccessToken(token: any) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken as string
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
      refreshToken: data.refresh_token ?? token.refreshToken
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

// Exporta os handlers para rotas de API
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export default NextAuth(authOptions);