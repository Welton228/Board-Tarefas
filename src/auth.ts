import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { SupabaseAdapter } from "@auth/supabase-adapter";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // 1. CONEXÃO COM O BANCO (O que faltava!)
  // O Adapter faz o Auth.js salvar sessões e usuários nas tabelas que você criou no Supabase
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),

  trustHost: true,
  secret: process.env.AUTH_SECRET,

  session: {
    strategy: "database", // Mudamos para "database" para ele usar a tabela 'sessions' do Supabase
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
    async jwt({ token, user, account }) {
      if (account && user) {
        token.id = user.id;
        // Aplica a folga de 30s no token discutida anteriormente
        token.expiresAt = (account.expires_at ?? 0) * 1000 - 30000;
      }
      return token;
    },
    async session({ session, token, user }: any) {
      // No modo "database", o ID do usuário vem de 'user.id'
      const userId = token?.id || user?.id;
      if (userId && session.user) {
        session.user.id = userId;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});