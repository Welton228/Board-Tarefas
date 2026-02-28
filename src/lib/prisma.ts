import { PrismaClient } from '@prisma/client';

/**
 * 💡 PADRÃO SINGLETON
 * No Next.js (Node.js), o 'global' persiste entre recarregamentos.
 * Isso impede que cada "Save" no código abra uma nova conexão com o Supabase.
 */

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });
};

// Tipagem global para evitar o erro de 'any' no globalThis
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}