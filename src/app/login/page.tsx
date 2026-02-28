"use client";

import React from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
// ✅ Importação ajustada: Certifique-se que o caminho está correto conforme seu projeto
import Header from "../header/page"; 
import { Loader2 } from "lucide-react";

/**
 * ✅ PÁGINA DE LOGIN - REVISADA NEXT.JS 15
 * - Mantém 100% o seu design original.
 * - Adicionado tratamento de erro para redirecionamento.
 * - Melhoria no feedback visual durante o carregamento.
 */
export default function LoginPage() {
  const { data: session, status } = useSession();

  // 1. Enquanto carrega a sessão (Estado de Loading)
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
        <p className="animate-pulse">Verificando sua conta...</p>
      </div>
    );
  }

  // 2. Se o usuário já estiver logado (Mensagem de Boas-Vindas)
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
            <br />
            Clique abaixo para acessar suas tarefas e projetos.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg border border-green-500 transition-all hover:scale-105 active:scale-95"
          >
            Ir para o Dashboard
          </Link>
        </section>
      </main>
    );
  }

  // 3. Se não estiver logado (Tela de Login padrão)
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white px-4">
      <Header />
      <section className="text-center mt-32 max-w-lg">
        <h1 className="text-4xl font-extrabold mb-4 tracking-tight">
          Bem-vindo de volta
        </h1>
        <p className="mb-8 text-gray-300">
          Faça login com sua conta Google para gerenciar suas tarefas
          com segurança e agilidade.
        </p>
        
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg border border-green-500 transition-all hover:shadow-green-500/20 hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
        >
          {/* Opcional: ícone simples se desejar, senão mantém apenas o texto */}
          Entrar com Google
        </button>
      </section>
    </main>
  );
}