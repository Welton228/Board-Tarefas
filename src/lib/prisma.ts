// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Variável global para evitar múltiplas instâncias do Prisma no Next.js
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Instanciando o PrismaClient apontando para o Supabase
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL, // ✅ URL atualizada no .env
      },
    },
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error'] // Mostra queries no desenvolvimento
        : ['warn', 'error'],          // Apenas avisos e erros na produção
  });

// Evita múltiplas instâncias durante hot reload no desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
