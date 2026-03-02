import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/**
 * ✅ SOLUÇÃO DEFINITIVA (Auth.js v5):
 * Na v5, não usamos mais 'NextAuthOptions' ou 'authOptions'.
 * Passamos a configuração diretamente para a função NextAuth.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // 1. SEGURANÇA (O trustHost agora é nativo aqui, sem precisar de extensões)
  trustHost: true,
  secret: process.env.AUTH_SECRET,

  // 2. ESTRATÉGIA DE SESSÃO
  // Corrigido: Na v5, a tipagem mudou internamente, mas a propriedade continua aqui.
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  // 3. PROVEDORES
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

  // 4. CALLBACKS (Tipagem automática do v5)
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.id = user.id;
        // Adicionando a folga de 30s no token para evitar logout precoce
        token.expiresAt = (account.expires_at ?? 0) * 1000 - 30000;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  // 5. PÁGINAS CUSTOMIZADAS
  pages: {
    signIn: "/login",
  },
});