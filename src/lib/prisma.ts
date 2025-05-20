// lib/prisma.ts

/**
 * Configuração do cliente Prisma para o Next.js
 * 
 * Este arquivo gerencia a instância do Prisma Client, garantindo que apenas uma instância
 * seja criada e reutilizada durante o hot-reload no desenvolvimento.
 */

import { PrismaClient } from '@prisma/client';

// 1. Definição do tipo global para TypeScript
// Extendemos o escopo global para incluir nossa instância do Prisma
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// 2. Criação ou reutilização da instância do Prisma
/**
 * Instância do Prisma Client:
 * - Em produção: sempre cria uma nova instância
 * - Em desenvolvimento: reutiliza a instância existente se disponível
 * - Tipagem segura com TypeScript
 */
export const prisma: PrismaClient = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

// 3. Configuração específica para ambiente de desenvolvimento
/**
 * Em desenvolvimento, armazenamos a instância no escopo global
 * para evitar vazamento de memória durante o hot-reload do Next.js
 */
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// 4. Boas práticas ao encerrar a aplicação
/**
 * Configura listeners para eventos de encerramento
 * Garante que a conexão seja fechada adequadamente
 */
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// 5. Exportação padrão
export default prisma;