// lib/auth.ts

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";

// Validação segura do .env
const getEnvVars = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const secret = process.env.NEXTAUTH_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("❌ GOOGLE_CLIENT_ID e/ou GOOGLE_CLIENT_SECRET não definidos");
  }

  if (!secret || secret.length < 32) {
    throw new Error("❌ NEXTAUTH_SECRET inválido ou muito curto (mínimo 32 caracteres)");
  }

  return { clientId, clientSecret, secret };
};

const env = getEnvVars();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: env.clientId,
      clientSecret: env.clientSecret,
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

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
      }

      if (user) {
        token.id = user.id;
        token.name = user.name; // permite acessar nome direto na session
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/auth/error",
  },

  secret: env.secret,
  debug: process.env.NODE_ENV === "development",
  useSecureCookies: process.env.NODE_ENV === "production",
};
