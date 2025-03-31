import NextAuth, { type NextAuthOptions, type SessionStrategy } from "next-auth";
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  // Configuração dos provedores de autenticação
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],

  // Chave secreta para criptografia
  secret: process.env.NEXTAUTH_SECRET,

  // Configuração de sessão usando JWT com tipagem correta
  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60, // 30 dias de duração
  },

  // Callbacks com tipagem explícita
  callbacks: {
    async jwt({ token, user, account }: { 
      token: any;
      user?: any;
      account?: any;
    }) {
      // Adiciona o access_token do provedor ao token JWT
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      
      // Adiciona o ID do usuário ao token
      if (user?.id) {
        token.id = user.id;
      }
      
      return token;
    },

    async session({ session, token }: { 
      session: any;
      token: any;
    }) {
      // Passa os dados necessários para a sessão do cliente
      if (token.id) {
        session.user.id = token.id;
      }
      
      if (token.accessToken) {
        session.accessToken = token.accessToken;
      }
      
      return session;
    },
  },

  // Configuração de cookies com tipagem
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

// Exporta os handlers para rotas de API
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };