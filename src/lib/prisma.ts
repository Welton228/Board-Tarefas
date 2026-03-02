import { PrismaClient } from '@prisma/client';

/**
 * 💡 PADRÃO SINGLETON REFORÇADO
 * No Next.js, o hot-reloading cria instâncias duplicadas do PrismaClient.
 * Este padrão garante que apenas uma conexão seja mantida no ambiente de desenvolvimento.
 */

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });
};

// Extende o objeto global do Node.js para armazenar a instância do Prisma
// Isso evita que o TypeScript reclame do 'global.prisma'
declare global {
  // eslint-disable-next-line no-var
  var prisma: ReturnType<typeof prismaClientSingleton> | undefined;
}

// Inicializa o cliente: tenta usar o global primeiro, se não existir, cria um novo
const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

// Se não estivermos em produção, salvamos a instância no objeto global
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}