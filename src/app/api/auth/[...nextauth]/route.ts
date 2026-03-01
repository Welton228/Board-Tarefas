import { handlers } from "@/src/auth";
import { NextRequest } from "next/server";

/**
 * 🔐 Rota de Autenticação (Next.js 15 + Auth.js v5)
 * Usamos uma função assíncrona para garantir que o 'handlers' 
 * só seja invocado após a inicialização completa do servidor.
 */

export async function GET(req: NextRequest) {
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  return handlers.POST(req);
}

// ⚙️ Configurações Críticas de Build
export const runtime = "nodejs";
export const dynamic = "force-dynamic";