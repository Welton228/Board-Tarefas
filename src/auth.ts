import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/**
 * 🔄 FUNÇÃO DE REFRESH TOKEN
 */
async function refreshAccessToken(token: any) {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
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
    if (!response.ok) throw refreshedTokens;

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Erro ao renovar token:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

/**
 * ⚙️ CONFIGURAÇÃO (Inferred Type)
 * Removi o 'NextAuthConfig' explícito para evitar o erro de 'no exported member'.
 */
const authOptions = {
  trustHost: true,
  basePath: "/api/auth", 
  session: { 
    strategy: "jwt" as const, // O 'as const' ajuda o TS a entender a estratégia
    maxAge: 30 * 24 * 60 * 60 
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: { 
          prompt: "consent", 
          access_type: "offline", 
          response_type: "code" 
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }: any) {
      if (account && user) {
        return {
          ...token,
          id: user.id,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: (account.expires_at ?? 0) * 1000,
        };
      }

      const now = Date.now();
      const expirationTime = (token.accessTokenExpires as number) || 0;
      const shouldRefresh = now > expirationTime - 30 * 1000;

      if (!shouldRefresh) return token;

      return refreshAccessToken(token);
    },
    async session({ session, token }: any) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session as any).error = token.error;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/login" },
};

// 🚀 EXPORTAÇÃO EXECUTÁVEL
const authData = NextAuth(authOptions);

export const handlers = authData.handlers;
export const auth = authData.auth;
export const signIn = authData.signIn;
export const signOut = authData.signOut;