// app/api/auth/[...nextauth]/route.ts

// Importa a função NextAuth para criar o handler de autenticação
import NextAuth from 'next-auth';

// Importa as opções de autenticação personalizadas
import { authOptions } from '@/lib/auth';

// Cria o handler com as opções definidas
const handler = NextAuth(authOptions);

// Exporta o handler tanto para requisições GET quanto POST
export { handler as GET, handler as POST };
