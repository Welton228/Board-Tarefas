import { PrismaClient } from '@prisma/client';

/**
 * 💡 PADRÃO SINGLETON REFORÇADO (Best Practice)
 * * Por que isso é necessário?
 * No Next.js (Desenvolvimento), o "Hot Reloading" reinicia o servidor a cada salvamento de arquivo.
 * Se criarmos um `new PrismaClient()` direto, cada salvamento abriria uma nova conexão com o banco.
 * Em poucos minutos, você atingiria o limite de conexões (Connection Limit) do seu PostgreSQL.
 * * Este arquivo garante que o PrismaClient seja instanciado apenas UMA vez.
 */

// 1. Definição da função de criação do cliente
const prismaClientSingleton = () => {
  return new PrismaClient({
    // Configura logs estratégicos: queries apenas em dev, erros sempre.
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });
};

// 2. Tipagem para o escopo global do Node.js
// Usamos 'undefined' para permitir a verificação de existência na inicialização.
type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

declare global {
  /**
   * Usamos 'var' em vez de 'let/const' aqui porque o escopo global do Node 
   * exige 'var' para que a propriedade seja anexada corretamente ao objeto global.
   */
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClientSingleton | undefined;
}

// 3. Inicialização Inteligente
// Tenta recuperar do global (dev) ou cria um novo (prod ou primeira execução)
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// 4. Exportação do Cliente
export default prisma;

// 5. Preservação da instância em ambiente de Desenvolvimento
// Isso impede que o Hot Reload crie novas conexões a cada mudança no código.
if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}