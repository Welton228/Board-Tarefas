import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client"; // Se quiser tipar usuário

// Interface para criar usuário no banco com name
interface UserCreateInputWithNome {
  email: string;
  name: string;
  password: string;
}

/**
 * Função para renovar access token Google usando refresh token
 */
const refreshAccessToken = async (token: any) => {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken!,
      }),
    });

    const data = await response.json();

    if (!response.ok) throw data;

    return {
      ...token,
      accessToken: data.access_token,
      accessTokenExpires: Date.now() + data.expires_in * 1000, // nova expiração em ms
      refreshToken: data.refresh_token ?? token.refreshToken, // atualiza se novo refreshToken recebido
      error: undefined,
    };
  } catch (error) {
    console.error("[REFRESH TOKEN ERROR]", error);

    // Mantém o token antigo e adiciona erro para callback lidar
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
};

/**
 * Configurações do NextAuth
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope:
            "openid email profile https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
    updateAge: 24 * 60 * 60, // atualiza token a cada 24h
  },

  callbacks: {
    /**
     * Callback JWT chamado sempre que o token é criado ou acessado
     */
    async jwt({ token, account, user, trigger, session }) {
      console.log("[JWT CALLBACK] Params:", {
        trigger,
        account,
        user,
        token,
        session,
      });

      // Atualização manual da sessão
      if (trigger === "update" && session?.user) {
        return {
          ...token,
          name: session.user.name,
          email: session.user.email,
          picture: session.user.image,
        };
      }

      // Primeiro login, salva dados e tokens
      if (account && user) {
        // Upsert no banco para garantir usuário
        const dbUser = await prisma.user.upsert({
          where: { email: user.email! },
          update: {},
          create: {
            email: user.email!,
            name: user.name || "",
            password: "",
          } as UserCreateInputWithNome,
        });

        return {
          ...token,
          id: dbUser.id,
          name: dbUser.name ?? "",
          email: dbUser.email,
          picture: user.image,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000, // fallback 1h
          error: undefined,
        };
      }

      // Se token ainda válido, retorna ele
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Token expirado: renova
      console.log("[JWT CALLBACK] Access token expirado. Renovando...");

      if (!token.refreshToken) {
        console.warn("[JWT CALLBACK] Sem refresh token, logout forçado.");
        return {
          ...token,
          error: "NoRefreshTokenError",
        };
      }

      const refreshedToken = await refreshAccessToken(token);

      console.log("[JWT CALLBACK] Token renovado:", refreshedToken);

      return refreshedToken;
    },

    /**
     * Callback para montar sessão no frontend
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.accessToken = token.accessToken as string;
        session.error = token.error;
      }
      return session;
    },

    /**
     * Controla redirecionamento após login/logout
     */
    async redirect({ url, baseUrl }) {
      return baseUrl;
    },
  },

  pages: {
    signIn: "/login",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET!,

  debug: process.env.NEXTAUTH_DEBUG === "true",

  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 dias
      },
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
