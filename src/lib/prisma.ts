// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Evita múltiplas instâncias do Prisma no desenvolvimento (Hot Reload)
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Cria uma instância única do PrismaClient
 */
const criarClientePrisma = (): PrismaClient => {
  const cliente = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'warn', 'error']  // Logs detalhados no dev
      : ['warn', 'error'],          // Logs essenciais em produção
  });

  // Apenas em desenvolvimento, mostra logs no console
  if (process.env.NODE_ENV === 'development') {
    cliente.$on('query', (e:any) => {
      console.log(`[Prisma Query] ${e.query} | Params: ${e.params} | ${e.duration}ms`);
    });

    cliente.$on('warn', (e:any) => {
      console.warn(`[Prisma Warn] ${e.message}`);
    });

    cliente.$on('error', (e:any) => {
      console.error(`[Prisma Error] ${e.message}`);
    });
  }

  return cliente;
};

// Usa singleton global no dev para evitar múltiplas conexões
const prisma = globalThis.prisma ?? criarClientePrisma();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

// Desconecta ao encerrar o processo (em produção)
if (process.env.NODE_ENV === "production") {
  const encerrar = async (signal: NodeJS.Signals) => {
    console.log(`[Prisma] Sinal recebido (${signal}), desconectando...`);
    await prisma.$disconnect();
    process.exit(0);
  };

  if (typeof window === "undefined") {
    process.on("SIGINT", encerrar);
    process.on("SIGTERM", encerrar);
    process.on("beforeExit", async () => {
      await prisma.$disconnect();
    });
  }
}

export default prisma;
