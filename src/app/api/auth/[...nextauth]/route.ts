/**
 * 🔐 Rota de Autenticação (Auth.js v5)
 * * Este arquivo é o ponto de entrada para todas as chamadas de login, logout e sessões.
 * Ele atua como um "proxy" para as funções definidas em @/lib/auth.
 */

import { handlers } from "../../../../../src/auth";

// Define que esta rota deve rodar no ambiente Node.js estável.
// Essencial para compatibilidade com bibliotecas de banco de dados (Prisma).
export const runtime = "nodejs";

/**
 * 🚀 EXPORTS
 * No Auth.js v5 (Next.js 15), não usamos mais o 'NextAuth(authOptions)'.
 * Exportamos diretamente os handlers GET e POST que o sistema já preparou.
 */
export const { GET, POST } = handlers;

// Forçamos que esta rota seja sempre dinâmica para evitar cache de sessões antigas.
export const dynamic = "force-dynamic";