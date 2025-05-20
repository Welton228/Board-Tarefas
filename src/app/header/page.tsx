"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, ArrowLeft, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
  const { data: session, status } = useSession({
    required: false,
  });

  const [scrolled, setScrolled] = useState(false);
  const [isHoveringUser, setIsHoveringUser] = useState(false);
  const router = useRouter();

  // Efeito de scroll para mudar o estilo do header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Login com Google - removida a mensagem de erro
  const handleLogin = async () => {
    await signIn("google", { redirect: false });
    // Não mostra mais mensagem de erro, apenas tenta fazer login
  };

  // Logout simples
  const handleLogout = async () => {
    await signOut({ redirect: false });
  };

  // Obtém a inicial do nome do usuário
  const getInitial = (name?: string | null) => {
    return name ? name.charAt(0).toUpperCase() : "";
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
    >
      <section className="w-full max-w-7xl flex items-center justify-between">
        {/* Navegação à esquerda - Botão Home */}
        <nav className="flex items-center space-x-4 sm:space-x-6">
          <motion.div whileHover={{ scale: 1.05 }}>
            <Link 
              href="/" 
              className="no-underline flex items-center space-x-2 group"
            >
              <div className="p-2 rounded-full bg-blue-600/20 group-hover:bg-blue-500/30 transition-all">
                <ArrowLeft className="text-blue-300 w-5 h-5 group-hover:text-white transition-colors" />
              </div>
              <span className="text-blue-200 text-lg font-medium hidden sm:inline group-hover:text-white transition-colors">
                Início
              </span>
            </Link>
          </motion.div>

          {/* Botão Dashboard visível quando logado */}
          {session?.user && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/dashboard")}
              aria-label="Acessar meu painel"
              className="relative flex items-center justify-center gap-2 text-white bg-gradient-to-r from-blue-600 to-blue-700
                py-2 px-5 rounded-xl font-medium
                shadow-lg
                hover:shadow-blue-500/30
                transition-all duration-300
                border border-blue-500/30"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="hidden sm:inline">Meu Painel</span>
            </motion.button>
          )}
        </nav>

        {/* Área do usuário */}
        {status === "loading" ? (
          // Skeleton loading enquanto carrega
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-gray-700/50 animate-pulse"></div>
            <div className="hidden sm:block w-24 h-6 rounded bg-gray-700/50 animate-pulse"></div>
          </div>
        ) : session ? (
          // Usuário logado
          <motion.div 
            className="flex items-center gap-2 sm:gap-4"
            onHoverStart={() => setIsHoveringUser(true)}
            onHoverEnd={() => setIsHoveringUser(false)}
          >
            {/* Avatar do usuário com efeito de hover */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.1 }}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-lg shadow-md">
                {getInitial(session.user?.name)}
              </div>
              
              {/* Efeito de pulse quando hover */}
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

            {/* Nome do usuário (mobile/desktop) */}
            <span className="hidden sm:inline text-white font-medium text-base">
              {session.user?.name}
            </span>

            {/* Botão de Logout com efeitos */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              aria-label="Sair do sistema"
              className="relative flex items-center justify-center gap-2 text-white bg-gradient-to-r from-red-600 to-red-700
                py-2 px-4 sm:px-5 rounded-xl font-medium
                shadow-lg
                hover:shadow-red-500/20
                transition-all duration-300
                border border-red-500/30
                overflow-hidden"
            >
              {/* Efeito de brilho no hover */}
              <motion.span
                className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"
                initial={{ x: -100 }}
                whileHover={{ x: 100 }}
                transition={{ duration: 1 }}
              />
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Sair</span>
            </motion.button>
          </motion.div>
        ) : (
          // Botão de Login para usuários não autenticados
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogin}
            aria-label="Entrar no sistema"
            className="relative flex items-center justify-center gap-2 text-white bg-gradient-to-r from-green-600 to-green-700
              py-2 px-4 sm:px-5 rounded-xl font-medium
              shadow-lg
              hover:shadow-green-500/20
              transition-all duration-300
              border border-green-500/30
              overflow-hidden"
          >
            {/* Efeito de brilho no hover */}
            <motion.span
              className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"
              initial={{ x: -100 }}
              whileHover={{ x: 100 }}
              transition={{ duration: 1 }}
            />
            <LogIn className="w-5 h-5" />
            <span className="hidden sm:inline">Acessar</span>
          </motion.button>
        )}
      </section>
    </motion.header>
  );
};

export default Header;