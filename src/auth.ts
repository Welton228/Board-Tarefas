import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/**
 * 🔄 FUNÇÃO DE REFRESH TOKEN
 * Evita o deslogue automático renovando o acesso com o Google.
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
 * 🚀 EXPORTAÇÃO CENTRALIZADA
 * Este é o único arquivo que você precisará para autenticação.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: { prompt: "consent", access_type: "offline", response_type: "code" },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }: any) {
      // Login Inicial
      if (account && user) {
        return {
          ...token,
          id: user.id,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: (account.expires_at ?? 0) * 1000,
        };
      }

      // Regra da folga de 30 segundos
      const shouldRefresh = Date.now() > (token.accessTokenExpires as number) - 30 * 1000;
      if (!shouldRefresh) return token;

      return refreshAccessToken(token);
    },
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id;
        session.error = token.error;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/login" },
});