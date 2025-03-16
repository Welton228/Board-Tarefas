// Importa o PrismaClient do pacote '@prisma/client'
import { PrismaClient } from '@prisma/client';

// Cria uma variável global para armazenar a instância do Prisma Client
// Isso é útil no Next.js para evitar a criação de múltiplas instâncias durante o hot-reload
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Exporta uma instância do Prisma Client
// Se já existir uma instância global, usa ela; caso contrário, cria uma nova
export const prisma =
  globalForPrisma.prisma || new PrismaClient();

// Em ambiente de desenvolvimento, armazena a instância do Prisma Client na variável global
// Isso evita a criação de novas instâncias a cada hot-reload
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;