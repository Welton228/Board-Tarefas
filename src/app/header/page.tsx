"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, ArrowLeft, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 🔷 Header do sistema
 * - Controla login/logout do usuário via Google (NextAuth)
 * - Inclui proteção contra redirecionamentos inválidos (404)
 * - Utiliza boas práticas de clean code e acessibilidade
 */
const Header: React.FC = () => {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [isHoveringUser, setIsHoveringUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  /**
   * ✅ Gera uma URL absoluta a partir de um caminho relativo
   * Evita inconsistência de domínio entre ambientes (dev/produção)
   */
  const getAbsoluteUrl = useCallback((path = "/") => {
    if (typeof window === "undefined") return path;
    const origin = window.location.origin.replace(/\/$/, ""); // remove barra final
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${origin}${cleanPath}`;
  }, []);

  /**
   * 🔹 Login com Google
   * - Usa redirecionamento automático do NextAuth
   * - Evita `redirect: false` para prevenir 404
   */
  const handleLogin = useCallback(async () => {
    if (isLoading) return; // evita duplo clique
    setIsLoading(true);

    try {
      await signIn("google", {
        callbackUrl: getAbsoluteUrl("/dashboard"),
      });
    } catch (error) {
      console.error("Erro no login:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getAbsoluteUrl, isLoading]);

  /**
   * 🔹 Logout
   * - Usa redirecionamento automático para home
   */
  const handleLogout = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      await signOut({
        callbackUrl: getAbsoluteUrl("/"),
      });
    } catch (error) {
      console.error("Erro no logout:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getAbsoluteUrl, isLoading]);

  /**
   * 🔤 Retorna a inicial do nome do usuário
   */
  const getInitial = useCallback((name?: string | null) => {
    return name?.trim().charAt(0).toUpperCase() ?? "";
  }, []);

  /**
   * 🎨 Estilos reutilizáveis dos botões
   */
  const buttonStyles = {
    base: "relative flex items-center justify-center gap-2 text-white font-medium shadow-lg transition-all duration-300 overflow-hidden",
    size: "py-2 px-4 sm:px-5 rounded-xl",
    border: "border border-opacity-30",
  };

  /**
   * 🌫️ Efeito de scroll: altera o background do header ao rolar a página
   */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 w-full h-20 z-50 flex justify-center items-center px-4 transition-all duration-500 ${
        scrolled
          ? "bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 backdrop-blur-xl shadow-2xl border-b border-blue-500/20"
          : "bg-gradient-to-r from-gray-800 via-blue-800 to-gray-800"
      }`}
      role="banner"
    >
      <section className="w-full max-w-7xl flex items-center justify-between">
        {/* 🔹 Navegação principal */}
        <nav className="flex items-center space-x-4 sm:space-x-6" aria-label="Navegação principal">
          {/* Botão voltar para home */}
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

          {/* Botão acessar painel */}
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

        {/* 🔹 Área do usuário */}
        {status === "loading" ? (
          // Esqueleto de carregamento
          <div className="flex items-center gap-4" aria-busy="true">
            <div className="w-9 h-9 rounded-full bg-gray-700/50 animate-pulse" />
            <div className="hidden sm:block w-24 h-6 rounded bg-gray-700/50 animate-pulse" />
          </div>
        ) : session ? (
          // Quando o usuário está logado
          <motion.div
            className="flex items-center gap-2 sm:gap-4"
            onHoverStart={() => setIsHoveringUser(true)}
            onHoverEnd={() => setIsHoveringUser(false)}
            aria-label="Área do usuário"
          >
            {/* Avatar */}
            <motion.div className="relative" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-lg shadow-md">
                {getInitial(session.user?.name)}
              </div>
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

            {/* Nome */}
            <span className="hidden sm:inline text-white font-medium text-base truncate max-w-[120px]">
              {session.user?.name}
            </span>

            {/* Botão sair */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              disabled={isLoading}
              aria-label="Sair da conta"
              className={`${buttonStyles.base} ${buttonStyles.size} bg-gradient-to-r from-red-600 to-red-700 hover:shadow-red-500/20 ${buttonStyles.border} border-red-500`}
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Sair</span>
            </motion.button>
          </motion.div>
        ) : (
          // Quando o usuário NÃO está logado
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogin}
            disabled={isLoading}
            aria-label="Entrar na conta"
            className={`${buttonStyles.base} ${buttonStyles.size} bg-gradient-to-r from-green-600 to-green-700 hover:shadow-green-500/20 ${buttonStyles.border} border-green-500`}
          >
            <LogIn className="w-5 h-5" />
            <span className="hidden sm:inline">Acessar</span>
          </motion.button>
        )}
      </section>
    </motion.header>
  );
};

export default Header;
