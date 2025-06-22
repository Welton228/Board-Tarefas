"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, ArrowLeft, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
  // Obtém dados da sessão e status de carregamento
  const { data: session, status } = useSession({
    required: false,
  });

  const [scrolled, setScrolled] = useState(false);
  const [isHoveringUser, setIsHoveringUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Efeito para alterar o estilo do header ao rolar a página (com throttle simples)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setScrolled(window.scrollY > 10);
      }, 50);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  /**
   * Função para login com Google
   * - Usa signIn com redirect: false para controlar o redirecionamento manualmente
   * - Em caso de sucesso, redireciona para /dashboard
   * - Captura e loga erros
   */
  const handleLogin = useCallback(async () => {
    try {
      setIsLoading(true);

      const result = await signIn("google", { redirect: false });

      if (result?.error) {
        console.error("Erro no login:", result.error);
        // Aqui pode ser adicionado feedback visual (toast, modal etc)
      } else if (result?.ok) {
        router.push("/dashboard"); // Redireciona manualmente após login bem-sucedido
      }
    } catch (error) {
      console.error("Erro no login:", error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  /**
   * Função para logout
   * - Chama signOut com redirect: false para controle manual
   */
  const handleLogout = useCallback(async () => {
    try {
      setIsLoading(true);
      await signOut({ redirect: false });
      router.push("/"); // Redireciona para home após logout
    } catch (error) {
      console.error("Erro no logout:", error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  /**
   * Retorna a inicial do nome do usuário para exibir no avatar
   */
  const getInitial = useCallback((name?: string | null) => {
    if (!name) return "";
    const trimmedName = name.trim();
    return trimmedName.charAt(0).toUpperCase();
  }, []);

  // Estilos base para botões para reutilização
  const buttonStyles = {
    base: "relative flex items-center justify-center gap-2 text-white font-medium shadow-lg transition-all duration-300 overflow-hidden",
    size: "py-2 px-4 sm:px-5 rounded-xl",
    border: "border border-opacity-30",
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 w-full h-20 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 backdrop-blur-xl shadow-2xl border-b border-blue-500/20"
          : "bg-gradient-to-r from-gray-800 via-blue-800 to-gray-800"
      } flex justify-center items-center px-4`}
      role="banner"
    >
      <section className="w-full max-w-7xl flex items-center justify-between">
        {/* Navegação à esquerda - Botão Home */}
        <nav
          className="flex items-center space-x-4 sm:space-x-6"
          aria-label="Navegação principal"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/"
              className="no-underline flex items-center space-x-2 group"
              aria-label="Voltar para a página inicial"
            >
              <div className="p-2 rounded-full bg-blue-600/20 group-hover:bg-blue-500/30 transition-all">
                <ArrowLeft className="text-blue-300 w-5 h-5 group-hover:text-white transition-colors" />
              </div>
              <span className="text-blue-200 text-lg font-medium hidden sm:inline group-hover:text-white transition-colors">
                Início
              </span>
            </Link>
          </motion.div>

          {/* Botão Dashboard visível somente se usuário estiver logado */}
          {session?.user && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/dashboard")}
              aria-label="Acessar painel de controle"
              disabled={isLoading}
              className={`${buttonStyles.base} ${buttonStyles.size} bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-blue-500/30 ${buttonStyles.border} border-blue-500`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="hidden sm:inline">Meu Painel</span>
            </motion.button>
          )}
        </nav>

        {/* Área do usuário */}
        {status === "loading" ? (
          // Skeleton enquanto a sessão está carregando
          <div className="flex items-center gap-4" aria-busy="true">
            <div
              className="w-9 h-9 rounded-full bg-gray-700/50 animate-pulse"
              aria-hidden="true"
            ></div>
            <div
              className="hidden sm:block w-24 h-6 rounded bg-gray-700/50 animate-pulse"
              aria-hidden="true"
            ></div>
          </div>
        ) : session ? (
          // Usuário autenticado
          <motion.div
            className="flex items-center gap-2 sm:gap-4"
            onHoverStart={() => setIsHoveringUser(true)}
            onHoverEnd={() => setIsHoveringUser(false)}
            aria-label="Área do usuário"
          >
            {/* Avatar com inicial e efeito de hover */}
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Avatar do usuário"
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-lg shadow-md"
                aria-hidden="true"
              >
                {getInitial(session.user?.name)}
              </div>

              {/* Efeito pulse atrás do avatar no hover */}
              <AnimatePresence>
                {isHoveringUser && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 0.4 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="absolute inset-0 rounded-full bg-blue-400 -z-10"
                    aria-hidden="true"
                  />
                )}
              </AnimatePresence>
            </motion.div>

            {/* Nome do usuário */}
            <span className="hidden sm:inline text-white font-medium text-base truncate max-w-[120px]">
              {session.user?.name}
            </span>

            {/* Botão de logout */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              disabled={isLoading}
              aria-label="Sair da conta"
              className={`${buttonStyles.base} ${buttonStyles.size} bg-gradient-to-r from-red-600 to-red-700 hover:shadow-red-500/20 ${buttonStyles.border} border-red-500`}
            >
              {/* Efeito de brilho no hover */}
              <motion.span
                className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"
                initial={{ x: -100 }}
                whileHover={{ x: 100 }}
                transition={{ duration: 1 }}
                aria-hidden="true"
              />
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Sair</span>
              {isLoading && <span className="sr-only">Processando logout...</span>}
            </motion.button>
          </motion.div>
        ) : (
          // Botão de login para usuários não autenticados
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogin}
            disabled={isLoading}
            aria-label="Entrar na conta"
            className={`${buttonStyles.base} ${buttonStyles.size} bg-gradient-to-r from-green-600 to-green-700 hover:shadow-green-500/20 ${buttonStyles.border} border-green-500`}
          >
            {/* Efeito de brilho no hover */}
            <motion.span
              className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"
              initial={{ x: -100 }}
              whileHover={{ x: 100 }}
              transition={{ duration: 1 }}
              aria-hidden="true"
            />
            <LogIn className="w-5 h-5" />
            <span className="hidden sm:inline">Acessar</span>
            {isLoading && <span className="sr-only">Processando login...</span>}
          </motion.button>
        )}
      </section>
    </motion.header>
  );
};

export default Header;
