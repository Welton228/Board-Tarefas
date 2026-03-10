import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  // Estratégia de JWT é mais estável para evitar logouts inesperados em serverless
  session: { strategy: "jwt" }, 
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        // ✅ BOAS PRÁTICAS: Garantimos que o token tenha uma folga de 30s 
        // para evitar conflito de relógio entre servidores (skew time)
        token.expires_at = (account.expires_at ?? 0) + 30;
      }
      return token;
    },
    async session({ session, token }) {
      // Sincroniza o token com a sessão
      if (token) {
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // Define nossa página customizada
  },
});