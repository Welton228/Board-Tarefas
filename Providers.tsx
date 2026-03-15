import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * ✅ NOVIDADE NA V5: 
 * Não usamos mais 'NextAuthOptions'. Definimos a config dentro do NextAuth()
 * e exportamos os handlers e o objeto 'auth' (para uso no servidor).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile",
        },
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  trustHost: true, // ✅ Importante para produção (Vercel)

  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (trigger === 'update') {
        return { ...token, ...session.user };
      }

      // Primeiro login
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image
          }
        };
      }

      // Verifica validade (Folga de 30s)
      if (token.accessTokenExpires && Date.now() < (Number(token.accessTokenExpires) - 30000)) {
        return token;
      }

      // Token expirado - tenta renovar
      return await refreshAccessToken(token);
    },

    async session({ session, token }: any) {
      if (token.user) {
        session.user = {
          ...session.user,
          id: token.user.id,
          name: token.user.name,
          email: token.user.email,
          image: token.user.image
        };
      }
      
      session.accessToken = token.accessToken;
      session.error = token.error;
      
      return session;
    }
  },

  pages: {
    signIn: "/login",
    error: "/auth/error",
  },

  debug: process.env.NODE_ENV === "development",
});

/**
 * 🔄 Função de Refresh Token (Google)
 */
async function refreshAccessToken(token: any) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken as string
      })
    });

    const data = await response.json();
    if (!response.ok) throw data;

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