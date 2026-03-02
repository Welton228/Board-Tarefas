import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/**
 * 🛠️ EXTENSÃO DE TIPO (Custom AuthOptions)
 * Como o NextAuth v4 não reconhece 'trustHost', criamos uma interface 
 * que estende a original para incluir esta propriedade necessária na Vercel.
 */
interface ExtendedAuthOptions extends NextAuthOptions {
  trustHost?: boolean;
}

/**
 * 🔐 CONFIGURAÇÕES DE AUTENTICAÇÃO
 */
export const authOptions: ExtendedAuthOptions = {
  // trustHost é vital para evitar o logout automático na Vercel
  trustHost: true,
  
  secret: process.env.AUTH_SECRET,
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
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
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token?.id && session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};

/**
 * 🚀 EXPORTAÇÃO DOS HANDLERS
 */
const authData = NextAuth(authOptions);
export const { handlers, auth, signIn, signOut } = authData;