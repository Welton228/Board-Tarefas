"use client";

import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Header from "../header/page"; // ajuste o caminho conforme seu projeto

/**
 * ✅ Página de login revisada
 * - Login com Google sem redirecionar automaticamente para o dashboard.
 * - Mantém o Header e o design original.
 * - Se o usuário já estiver logado, apenas exibe a mensagem de boas-vindas.
 */
export default function LoginPage() {
  const { data: session, status } = useSession();

  // Enquanto carrega a sessão, mostra algo leve
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white">
        <p>Carregando...</p>
      </div>
    );
  }

  // ✅ Se o usuário estiver logado, mostra mensagem simples
  if (session) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white">
        <Header />
        <section className="text-center mt-32">
          <h1 className="text-3xl font-bold mb-4">
            Olá, {session.user?.name?.split(" ")[0]}!
          </h1>
          <p className="mb-6 text-gray-300">
            Você já está autenticado. Clique abaixo para acessar o painel de tarefas.
          </p>
          <a
            href="/dashboard"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg border border-green-500"
          >
            Ir para o Dashboard
          </a>
        </section>
      </main>
    );
  }

  // ✅ Se não estiver logado, renderiza botão de login normalmente
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white">
      <Header />
      <section className="text-center mt-32">
        <h1 className="text-3xl font-bold mb-4">Bem-vindo de volta</h1>
        <p className="mb-6 text-gray-300">
          Faça login com sua conta Google para acessar o painel.
        </p>
        <button
          // 🔹 Removido o callbackUrl para não redirecionar automaticamente
          onClick={() => signIn("google")}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg border border-green-500"
        >
          Entrar com Google
        </button>
      </section>
    </main>
  );
}
