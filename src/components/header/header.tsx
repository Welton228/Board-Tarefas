"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  LogIn, LogOut, LayoutDashboard, Loader2, 
  ArrowLeft, Layers 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 🌌 COMPONENTE: Header Nexus
 * Design Glassmorphism com foco em acessibilidade e performance.
 */
const Header: React.FC = () => {
  const { data: session, status } = useSession();
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const executeAuthAction = useCallback(async (action: () => Promise<any>) => {
    setIsPending(true);
    try {
      await action();
    } catch (error) {
      console.error("[AUTH_ACTION_ERROR]:", error);
    } finally {
      setIsPending(false);
    }
  }, []);

  const isLoading = status === "loading" || isPending;

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 w-full h-20 z-60 flex justify-center items-center px-8 bg-black/40 backdrop-blur-2xl border-b border-white/5"    >
      <div className="w-full max-w-7xl flex justify-between items-center">
        
        {/* 🚀 BRANDING & NAVEGAÇÃO VOLTAR */}
        <div className="flex items-center gap-8">
          <Link 
            href="/" 
            className="group flex items-center gap-3 text-gray-400 hover:text-white transition-all duration-300"
            aria-label="Voltar para a página inicial"
          >
            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-blue-600/20 transition-colors">
              <ArrowLeft size={18} aria-hidden="true" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Início</span>
          </Link>

             <div className="h-4 w-px bg-white/10 hidden md:block" />
          <Link href="/" className="flex items-center gap-3 group">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.3)] group-hover:scale-110 transition-transform">
                <Layers size={18} className="text-white" />
             </div>
             <span className="text-lg font-black uppercase tracking-tighter bg-linear-to-r from-white to-gray-500 bg-clip-text text-transparent">
                Nexus
             </span>
          </Link>
        </div>

        {/* 🔐 AÇÕES DE USUÁRIO */}
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loader"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="p-2"
              >
                <Loader2 className="animate-spin text-blue-500" size={20} aria-label="Processando..." />
              </motion.div>
            ) : session ? (
              <motion.div 
                key="auth-user"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3"
              >
                <button 
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl border border-white/10 transition-all cursor-pointer group"
                  title="Acessar seu Painel de Controle"
                  aria-label="Ir para o Dashboard"
                >
                  <LayoutDashboard size={16} className="text-blue-400 group-hover:rotate-3 transition-transform" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Dashboard</span>
                </button>
                
                <button 
                  onClick={() => executeAuthAction(() => signOut({ callbackUrl: "/" }))}
                  className="p-3 text-gray-500 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-xl border border-white/5 hover:border-red-500/20 transition-all cursor-pointer"
                  title="Sair da conta"
                  aria-label="Sair do sistema"
                >
                  <LogOut size={18} aria-hidden="true" />
                </button>
              </motion.div>
            ) : (
              <motion.button 
                key="no-auth"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => executeAuthAction(() => signIn("google", { callbackUrl: "/dashboard" }))}
                className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all cursor-pointer"
                title="Acessar com sua conta Google"
                aria-label="Entrar no Nexus"
              >
                <LogIn size={18} aria-hidden="true" />
                <span className="text-[11px] font-black uppercase tracking-widest">Entrar no Nexus</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;