"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, ArrowLeft, LayoutDashboard, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ✅ HEADER PRINCIPAL - REVISADO NEXT.JS 15
 * - Estabilidade de sessão aprimorada
 * - Lógica de redirecionamento simplificada
 * - Feedback visual de carregamento
 */
const Header: React.FC = () => {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  /**
   * 🔐 LOGIN COM GOOGLE
   * Simplificado para evitar conflitos de callback no Next.js 15
   */
  const handleLogin = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      // O callbackUrl deve ser apenas o path, o NextAuth resolve o domínio
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err) {
      console.error("[HEADER_LOGIN_ERROR]:", err);
      setIsLoading(false); // Só volta o loading se der erro, senão o redirect cuida
    }
  }, [isLoading]);

  /**
   * 🔐 LOGOUT
   * Força a limpeza completa do estado local
   */
  const handleLogout = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      console.error("[HEADER_LOGOUT_ERROR]:", err);
      setIsLoading(false);
    }
  }, [isLoading]);

  // Efeito de Scroll (Performance: passive listener)
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getInitial = (name?: string | null) => 
    name?.trim() ? name.trim().charAt(0).toUpperCase() : "U";

  // Estilos base para evitar repetição (DRY - Don't Repeat Yourself)
  const btnClass = "relative flex items-center justify-center gap-2 text-white font-medium py-2 px-4 sm:px-5 rounded-xl transition-all duration-300 shadow-lg";

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed top-0 w-full h-20 z-50 flex justify-center items-center px-4 transition-all duration-500 ${
        scrolled 
          ? "bg-gray-900/80 backdrop-blur-xl border-b border-blue-500/20" 
          : "bg-transparent"
      }`}
    >
      <section className="w-full max-w-7xl flex items-center justify-between">
        {/* Lado Esquerdo: Navegação */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="group flex items-center gap-2 no-underline">
            <div className="p-2 rounded-full bg-blue-600/10 group-hover:bg-blue-600/30 transition-all">
              <ArrowLeft className="text-blue-400 w-5 h-5 group-hover:text-white" />
            </div>
            <span className="text-blue-100 font-medium hidden sm:block group-hover:text-white">Início</span>
          </Link>

          {session && (
            <button
              onClick={() => router.push("/dashboard")}
              className={`${btnClass} bg-blue-600 hover:bg-blue-500 border border-blue-400/30`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Painel</span>
            </button>
          )}
        </div>

        {/* Lado Direito: Status de Sessão */}
        <div className="flex items-center gap-3">
          {status === "loading" || isLoading ? (
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          ) : session ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-800/50 p-1 pr-3 rounded-full border border-gray-700">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {getInitial(session.user?.name)}
                </div>
                <span className="text-sm text-gray-200 hidden md:inline">{session.user?.name?.split(' ')[0]}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className={`${btnClass} bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30`}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className={`${btnClass} bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/30`}
            >
              <LogIn className="w-4 h-4" />
              <span>Acessar</span>
            </button>
          )}
        </div>
      </section>
    </motion.header>
  );
};

export default Header;