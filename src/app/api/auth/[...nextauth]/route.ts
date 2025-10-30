// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// ✅ Garante que a rota rode no ambiente Node.js (necessário para OAuth)
export const runtime = "nodejs";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  // ✅ Define a página de login personalizada
  pages: {
    signIn: "/login",
  },

  callbacks: {
    // ✅ Controla o redirecionamento após o login
    async redirect({ url, baseUrl }) {
      // Evita o redirecionamento automático para callbackUrl
      // Sempre retorna o domínio base (mantém o usuário na home)
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },

  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };
