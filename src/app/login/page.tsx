"use client";

import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "../header/page"; // ajuste o caminho conforme seu projeto

/**
 * ✅ Página de login
 * - Redireciona automaticamente se o usuário já estiver logado
 * - Usa o Header normalmente
 * - Evita loop e corrige fluxo de autenticação
 */
export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Se já estiver logado, redireciona pro dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/ClientDashboard");
    }
  }, [status, router]);

  // Enquanto carrega a sessão, mostra algo leve
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white">
        <p>Carregando...</p>
      </div>
    );
  }

  // Se não estiver logado, renderiza o header e botão de login
  if (!session) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white">
        <Header />
        <section className="text-center mt-32">
          <h1 className="text-3xl font-bold mb-4">Bem-vindo de volta</h1>
          <p className="mb-6 text-gray-300">
            Faça login com sua conta Google para acessar o painel.
          </p>
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg border border-green-500"
          >
            Entrar com Google
          </button>
        </section>
      </main>
    );
  }

  // Fallback (caso raro)
  return null;
}
