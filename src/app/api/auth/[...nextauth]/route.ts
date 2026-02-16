/**
 * Rota oficial de autenticação (Auth.js v5)
 *
 * Apenas reaproveita os handlers exportados
 * do arquivo central lib/auth.ts
 */

import { handlers } from "@/lib/auth";

// Necessário para OAuth funcionar corretamente
export const runtime = "nodejs";

// Exporta automaticamente GET e POST
export const { GET, POST } = handlers;
