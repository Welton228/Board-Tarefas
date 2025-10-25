"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, ArrowLeft, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Header do sistema
 * - Compatível com NextAuth (Google)
 * - Correções para evitar 404 no redirecionamento pós-login/logout
 */
const Header: React.FC = () => {
  const { data: session, status } = useSession({ required: false });
  const [scrolled, setScrolled] = useState(false);
  const [isHoveringUser, setIsHoveringUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  /**
   * Cria um callbackUrl absoluto baseado na origem atual
   * Isso evita problemas quando o NextAuth tenta compor a URL
   * (útil tanto em localhost quanto em produção).
   */
  const getAbsoluteCallback = useCallback((path = "/") => {
    if (typeof window === "undefined") return path;
    try {
      return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
    } catch {
      return path;
    }
  }, []);

  /**
   * Login com Google
   * - redirect: false para controle manual
   * - callbackUrl absoluto para evitar mismatches com NEXTAUTH_URL
   */
  const handleLogin = useCallback(async () => {
    if (isLoading) return; // previne clique múltiplo
    setIsLoading(true);

    const callbackUrl = getAbsoluteCallback("/dashboard");

    try {
      const result = await signIn("google", {
        redirect: false,           // controla o redirecionamento manualmente
        callbackUrl,               // URL absoluta (ex: https://meusite.com/dashboard)
      });

      // result pode ser undefined em alguns cenários; preferimos usar callbackUrl como fallback
      const target = (result && (result as any).url) ? (result as any).url : callbackUrl;

      // segurança extra: verifica se target é uma string antes de push
      if (typeof target === "string" && target.length > 0) {
        // router.push aceita tanto path relativo quanto absoluto
        router.push(target);
      } else {
        // fallback seguro
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Erro no login:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getAbsoluteCallback, isLoading, router]);

  /**
   * Logout
   * - redirect: false para controle manual
   * - callbackUrl absoluto; redireciona para home após sair
   */
  const handleLogout = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    const callbackUrl = getAbsoluteCallback("/");

    try {
      const result = await signOut({
        redirect: false,
        callbackUrl,
      });

      const target = (result && (result as any).url) ? (result as any).url : callbackUrl;

      if (typeof target === "string" && target.length > 0) {
        router.push(target);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Erro no logout:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getAbsoluteCallback, isLoading, router]);

  /**
   * Inicial do nome do usuário
   */
  const getInitial = useCallback((name?: string | null) => {
    if (!name) return "";
    return name.trim().charAt(0).toUpperCase();
  }, []);

  const buttonStyles = {
    base: "relative flex items-center justify-center gap-2 text-white font-medium shadow-lg transition-all duration-300 overflow-hidden",
    size: "py-2 px-4 sm:px-5 rounded-xl",
    border: "border border-opacity-30",
  };

  /** Efeito de scroll para mudar background do header */
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
        <nav className="flex items-center space-x-4 sm:space-x-6" aria-label="Navegação principal">
          {/* Botão voltar para página inicial */}
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

          {/* Botão acessar painel, se usuário já estiver logado */}
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

        {/* Área do usuário / login */}
        {status === "loading" ? (
          <div className="flex items-center gap-4" aria-busy="true">
            <div className="w-9 h-9 rounded-full bg-gray-700/50 animate-pulse" aria-hidden="true"></div>
            <div className="hidden sm:block w-24 h-6 rounded bg-gray-700/50 animate-pulse" aria-hidden="true"></div>
          </div>
        ) : session ? (
          <motion.div
            className="flex items-center gap-2 sm:gap-4"
            onHoverStart={() => setIsHoveringUser(true)}
            onHoverEnd={() => setIsHoveringUser(false)}
            aria-label="Área do usuário"
          >
            {/* Avatar do usuário */}
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
          // Botão de login com Google
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogin}
            disabled={isLoading}
            aria-label="Entrar na conta"
            className={`${buttonStyles.base} ${buttonStyles.size} bg-gradient-to-r from-green-600 to-green-700 hover:shadow-green-500/20 ${buttonStyles.border} border-green-500`}
          >
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
