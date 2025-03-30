// next libs
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";

// Extendendo os tipos do NextAuth
declare module "next-auth" {
    interface Session {
        user: {
            id: string; // Adicionando a propriedade [id](cci:1://file:///c:/Users/user/Desktop/Nextjs%20Udemy/boardtarefas/Providers.tsx:5:0-16:1)
            name?: string | undefined;
            email?: string | undefined;
            image?: string | undefined;
        };
    }

    interface User {
        id: string; // Adicionando a propriedade [id](cci:1://file:///c:/Users/user/Desktop/Nextjs%20Udemy/boardtarefas/Providers.tsx:5:0-16:1)
        name?: string | undefined;
        email?: string | undefined
        image?: string | undefined;
    }
}

export const authOptions: NextAuthOptions = {
    // Configurando o provider
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
    ],
    secret: process.env.JWT_SECRET, // Chave secreta para criptografia
    callbacks: {
        // Adiciona o ID do usuário à sessão
        async session({ session, token }) {
            if (token.sub) {
                session.user.id = token.sub; // Adiciona o ID do usuário ao objeto de sessão
            }
            return session;
        },
        // Adiciona o ID do usuário ao token
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id; // Adiciona o ID do usuário ao token
            }
            return token;
        },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };