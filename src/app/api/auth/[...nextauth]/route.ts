import { handlers } from "@/src/auth";

/**
 * 🔐 ROTA DE AUTENTICAÇÃO (Auth.js v5)
 * No Next.js 15, exportamos os handlers diretamente. 
 * O Auth.js já gerencia internamente o 'req' e 'res' de forma otimizada.
 */
export const { GET, POST } = handlers;

/**
 * ⚙️ CONFIGURAÇÕES CRÍTICAS
 * 'force-dynamic' garante que a sessão não seja cacheada incorretamente no build.
 * 'nodejs' é necessário para processar os segredos e tokens JWT.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";