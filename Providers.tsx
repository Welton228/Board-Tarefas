import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";

/**
 * Configuração completa do NextAuth com:
 * - Provedor Google
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
          prompt: "consent", // Solicita o consentimento do usuário para acessar seus dados
          access_type: "offline", // Permite o refresh token
          response_type: "code", // Fluxo de autorização
          scope: "openid email profile" // Escopos necessários
        }
      }
    })
  ],

  // Chave secreta única para toda a aplicação
  secret: process.env.NEXTAUTH_SECRET,

  // Configuração de sessão (utilizando JWT)
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
        httpOnly: true, // Impede acesso via JavaScript
        sameSite: 'lax', // Configuração de segurança de cookies
        path: '/',
        secure: process.env.NODE_ENV === 'production', // Só segura em produção
        maxAge: 30 * 24 * 60 * 60 // 30 dias
      }
    }
  },

  // Callbacks para manipulação de tokens e sessões
  callbacks: {
    /**
     * Manipula o JWT no momento da autenticação.
     * - Se o login for o primeiro, ele adiciona o accessToken e refreshToken.
     * - Se o token estiver expirado, tenta renová-lo com o refreshToken.
     */
    async jwt({ token, user, account, trigger, session }) {
      if (trigger === 'update') {
        return { ...token, ...session.user }; // Atualiza token com dados do usuário
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

      // Token expirado - tenta renovar
      return await refreshAccessToken(token);
    },

    /**
     * Atualiza a sessão com as informações do token JWT.
     * - Inclui dados do usuário e o accessToken na sessão.
     */
    async session({ session, token }) {
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

  // Páginas customizadas para login e erro
  pages: {
    signIn: "/login", // Página de login
    error: "/auth/error", // Página de erro
    signOut: "/logout" // Página de logout
  },

  // Debug em desenvolvimento para facilitar a depuração
  debug: process.env.NODE_ENV === "development"
};

/**
 * Função para renovar o token de acesso quando ele expira.
 * - Utiliza o refresh token para obter um novo access token do Google.
 */
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

// Exporta os handlers para as rotas de API
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export default NextAuth(authOptions);
