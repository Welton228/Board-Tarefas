"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, ArrowLeft, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ✅ HEADER DO SISTEMA
 * - Gerencia autenticação via Google (NextAuth)
 * - Controla redirecionamento pós-login/logout
 * - Evita 404 e loops de autenticação
 * - Clean code e boas práticas com React Hooks
 */
const Header: React.FC = () => {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [isHoveringUser, setIsHoveringUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  /**
   * ✅ Cria uma URL absoluta baseada no ambiente atual.
   * Isso evita erros quando o NEXTAUTH_URL não bate com o domínio.
   * (funciona tanto em localhost quanto em produção na Vercel)
   */
  const getAbsoluteUrl = useCallback((path: string) => {
    if (typeof window === "undefined") return path;
    const origin = window.location.origin;
    return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
  }, []);

  /**
   * ✅ Lógica de login com Google
   * - Usa redirect manual para controle do fluxo.
   * - Redireciona com URL absoluta.
   */
  const handleLogin = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const callbackUrl = getAbsoluteUrl("/dashboard");

      // Inicia o login sem redirecionar automaticamente
      const result = await signIn("google", {
        redirect: false,
        callbackUrl,
      });

      // Determina a URL final (garantindo que sempre vá ao dashboard)
      const target = (result as any)?.url || callbackUrl;
      router.push(target);
    } catch (err) {
      console.error("Erro ao fazer login:", err);
    } finally {
      setIsLoading(false);
    }
  }, [getAbsoluteUrl, router, isLoading]);

  /**
   * ✅ Lógica de logout
   * - Sai da conta e redireciona para a home.
   */
  const handleLogout = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const callbackUrl = getAbsoluteUrl("/");
      const result = await signOut({ redirect: false, callbackUrl });
      const target = (result as any)?.url || callbackUrl;
      router.push(target);
    } catch (err) {
      console.error("Erro ao sair:", err);
    } finally {
      setIsLoading(false);
    }
  }, [getAbsoluteUrl, router, isLoading]);

  /**
   * ✅ Retorna a inicial do nome do usuário.
   */
  const getInitial = (name?: string | null) =>
    name ? name.trim().charAt(0).toUpperCase() : "";

  /**
   * ✅ Efeito de scroll para alterar a aparência do Header.
   */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const buttonBase =
    "relative flex items-center justify-center gap-2 text-white font-medium shadow-lg transition-all duration-300 overflow-hidden";
  const buttonSize = "py-2 px-4 sm:px-5 rounded-xl";

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
        {/* === Navegação principal === */}
        <nav
          className="flex items-center space-x-4 sm:space-x-6"
          aria-label="Navegação principal"
        >
          {/* Botão para página inicial */}
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

          {/* Botão "Meu Painel" se usuário estiver logado */}
          {session?.user && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/dashboard")}
              disabled={isLoading}
              aria-label="Ir para o painel de controle"
              className={`${buttonBase} ${buttonSize} bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-blue-500/30 border border-blue-500`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="hidden sm:inline">Meu Painel</span>
            </motion.button>
          )}
        </nav>

        {/* === Área do Usuário / Login === */}
        {status === "loading" ? (
          // Loader
          <div className="flex items-center gap-4" aria-busy="true">
            <div className="w-9 h-9 rounded-full bg-gray-700/50 animate-pulse"></div>
            <div className="hidden sm:block w-24 h-6 rounded bg-gray-700/50 animate-pulse"></div>
          </div>
        ) : session ? (
          // Usuário autenticado
          <motion.div
            className="flex items-center gap-2 sm:gap-4"
            onHoverStart={() => setIsHoveringUser(true)}
            onHoverEnd={() => setIsHoveringUser(false)}
          >
            {/* Avatar */}
            <motion.div className="relative" whileHover={{ scale: 1.1 }}>
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
                  />
                )}
              </AnimatePresence>
            </motion.div>

            {/* Nome do usuário */}
            <span className="hidden sm:inline text-white font-medium text-base truncate max-w-[120px]">
              {session.user?.name}
            </span>

            {/* Botão de Logout */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              disabled={isLoading}
              aria-label="Sair da conta"
              className={`${buttonBase} ${buttonSize} bg-gradient-to-r from-red-600 to-red-700 hover:shadow-red-500/20 border border-red-500`}
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Sair</span>
            </motion.button>
          </motion.div>
        ) : (
          // Usuário não autenticado → botão Login
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogin}
            disabled={isLoading}
            aria-label="Entrar na conta"
            className={`${buttonBase} ${buttonSize} bg-gradient-to-r from-green-600 to-green-700 hover:shadow-green-500/20 border border-green-500`}
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
