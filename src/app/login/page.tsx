"use client";

import React from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
// ✅ CORREÇÃO 1: Importe o Header de uma pasta de componentes, NUNCA de uma pasta 'page'
import Header from "../../components/header/header"; 
import { Loader2 } from "lucide-react";

/**
 * 🚀 NEXT.JS 15 - LOGIN PAGE
 * Por que 'force-dynamic'? No build, o Next.js tenta pré-renderizar esta página.
 * Como ela usa 'useSession', o compilador falha ao tentar 'congelar' o estado da sessão.
 */
export const dynamic = "force-dynamic";

export default function LoginPage() {
  const { data: session, status } = useSession();

  // 1. Estado de Loading (Previne o erro de hidratação)
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
        <p className="animate-pulse">Verificando sua conta...</p>
      </div>
    );
  }

  // 2. Interface para usuário logado
  if (session) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white px-4">
        <Header />
        <section className="text-center mt-32 max-w-lg">
          <h1 className="text-3xl font-bold mb-4 tracking-tight">
            Olá, {session.user?.name?.split(" ")[0]}!
          </h1>
          <p className="mb-8 text-gray-300">
            Você já está autenticado em nosso sistema.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            Ir para o Dashboard
          </Link>
        </section>
      </main>
    );
  }

  // 3. Interface para login
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white px-4">
      <Header />
      <section className="text-center mt-32 max-w-lg">
        <h1 className="text-4xl font-extrabold mb-4 tracking-tight">
          Bem-vindo de volta
        </h1>
        <p className="mb-8 text-gray-300">
          Faça login com sua conta Google para gerenciar suas tarefas.
        </p>
        
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg border border-green-500 transition-all hover:scale-105 flex items-center gap-3 mx-auto"
        >
          Entrar com Google
        </button>
      </section>
    </main>
  );
}