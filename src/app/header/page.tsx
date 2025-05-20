"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, ArrowLeft, LayoutDashboard } from "lucide-react";

const Header = () => {
  const { data: session, status } = useSession({
    required: false,
  });

  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  // Detecta rolagem para aplicar estilo ao header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Função de login com redirecionamento para dashboard somente se login for bem sucedido
  const handleLogin = async () => {
    const result = await signIn("google", { redirect: false });
    if (result?.ok) {
      router.push("/dashboard");
    } else {
      alert("Falha no login");
    }
  };

  // Função para logout simples, mantém na mesma página
  const handleLogout = async () => {
    await signOut({ redirect: false });
    // Opcional: você pode adicionar algo aqui, tipo uma mensagem ou redirecionar para home se quiser
  };

  // Retorna a inicial do nome do usuário
  const getInitial = (name?: string | null) => {
    return name ? name.charAt(0).toUpperCase() : "";
  };

  return (
    <header
      className={`fixed top-0 w-full h-20 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900/70 backdrop-blur-md shadow-lg"
          : "bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-800"
      } flex justify-center items-center p-4`}
    >
      <section className="w-full max-w-6xl flex items-center justify-between">
        {/* Navegação à esquerda */}
        <nav className="flex items-center space-x-4 sm:space-x-6">
          <Link href="/" className="no-underline flex items-center space-x-2">
            <ArrowLeft className="text-white w-6 h-6" />
            <span className="text-white text-lg font-medium hidden sm:inline">
              Início
            </span>
          </Link>

          {/* Link para o painel, visível apenas se logado */}
          {session?.user && (
            <button
              onClick={() => router.push("/dashboard")}
              aria-label="Acessar meu painel"
              className="relative flex items-center justify-center gap-2 text-black bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600
                py-2 px-5 rounded-3xl font-semibold
                shadow-lg
                hover:from-purple-500 hover:via-purple-600 hover:to-purple-700
                transition-all duration-300
                transform hover:scale-105"
            >
              <LayoutDashboard className="w-5 h-5 text-white" />
              Meu painel
            </button>
          )}
        </nav>

        {/* Área do usuário */}
        {status === "loading" ? null : session ? (
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Letra inicial do nome */}
            <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 text-white font-bold text-sm sm:text-base">
              {getInitial(session.user?.name)}
            </div>

            {/* Nome completo (visível apenas em telas ≥ 640px) */}
            <span className="hidden sm:inline text-white font-medium text-base">
              {session.user?.name}
            </span>

            {/* Botão de logout moderno e com brilho */}
            <button
              onClick={handleLogout}
              aria-label="Sair do sistema"
              className="relative flex items-center justify-center gap-2 text-white bg-gradient-to-r from-red-500 via-red-600 to-red-700
                py-2 px-5 rounded-3xl font-semibold
                shadow-lg
                hover:from-red-600 hover:via-red-700 hover:to-red-800
                transition-all duration-300
                transform hover:scale-110
                animate-pulse"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
        ) : (
          // Botão de login moderno e com brilho
          <button
            onClick={handleLogin}
            aria-label="Entrar no sistema"
            className="relative flex items-center justify-center gap-2 text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600
              py-2 px-5 rounded-3xl font-semibold
              shadow-lg
              hover:from-green-500 hover:via-green-600 hover:to-green-700
              transition-all duration-300
              transform hover:scale-110
              animate-pulse"
          >
            <LogIn className="w-5 h-5" />
            Acessar
          </button>
        )}
      </section>
    </header>
  );
};

export default Header;
