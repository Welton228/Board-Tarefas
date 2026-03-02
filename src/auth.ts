import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/**
 * Constantes de configuração para melhor legibilidade (Clean Code)
 */
const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;
const TOKEN_REFRESH_BUFFER_MS = 60 * 1000; // 60 segundos de folga para evitar deslogue precoce
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * 🔄 RENOVAÇÃO DE TOKEN (Refresh Token Flow)
 * Responsável por solicitar um novo access_token ao Google usando o refresh_token.
 */
async function refreshAccessToken(token: any) {
  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      // Calcula nova expiração baseada no tempo atual + segundos retornados pelo Google
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      // O Google nem sempre envia um novo refresh_token, então mantemos o antigo se necessário
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Erro crítico ao renovar access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

/**
 * ⚙️ CONFIGURAÇÃO CENTRAL DO NEXTAUTH
 */
export const authOptions = {
  // Melhora compatibilidade com proxies e Vercel
  trustHost: true,
  basePath: "/api/auth",
  
  session: {
    strategy: "jwt" as const, // JWT é a estratégia atual (não grava na tabela Session)
    maxAge: THIRTY_DAYS_IN_SECONDS,
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
    async jwt({ token, account, user }: any) {
      // Login inicial: persiste os dados do provedor no token
      if (account && user) {
        return {
          ...token,
          id: user.id,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: (account.expires_at ?? 0) * 1000,
        };
      }

      // Verificação de expiração para renovação automática
      const now = Date.now();
      const expirationTime = (token.accessTokenExpires as number) || 0;

      // Se não houver tempo de expiração, não tenta refresh para evitar erros
      if (expirationTime === 0) return token;

      // Verifica se o token está prestes a expirar (com margem de segurança)
      const isTokenExpired = now > expirationTime - TOKEN_REFRESH_BUFFER_MS;

      if (!isTokenExpired) {
        return token;
      }

      // Se expirou, tenta renovar usando o refresh_token do Google
      return refreshAccessToken(token);
    },

    async session({ session, token }: any) {
      if (token && session.user) {
        // Injeta o ID do usuário e possíveis erros de renovação na sessão
        session.user.id = token.id;
        session.error = token.error;
      }
      return session;
    },
  },

  secret: process.env.AUTH_SECRET,
  
  pages: {
    signIn: "/login",
  },
};

/**
 * 🚀 EXPORTAÇÃO DOS HANDLERS E MÉTODOS AUXILIARES
 */
const authData = NextAuth(authOptions);

export const { handlers, auth, signIn, signOut } = authData;