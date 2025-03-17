import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    // Adicione outros provedores aqui
  ],

  callbacks: {
    async session({ session, token }) {
      // Adiciona o ID do usuário à sessão
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      // Adiciona o ID do usuário ao token JWT
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};