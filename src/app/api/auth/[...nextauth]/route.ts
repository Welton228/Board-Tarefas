// next libs
import NextAuth from "next-auth";
// import Providers from "next-auth/providers";
import GoogleProvider from "next-auth/providers/google";


export const authOptions = {
    // configurando o provider
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,

        })
    ],
    secret: process.env.JWT_SECRET,
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
