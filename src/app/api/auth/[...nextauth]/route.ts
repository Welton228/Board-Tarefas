// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Importa a configuração centralizada com segurança

const handler = NextAuth(authOptions);

// Exporta para suportar métodos GET e POST
export { handler as GET, handler as POST };
