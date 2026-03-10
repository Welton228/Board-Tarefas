"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, LayoutDashboard, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const Header: React.FC = () => {
  const { data: session, status } = useSession();
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const executeAuthAction = useCallback(async (action: () => Promise<any>) => {
    setIsPending(true);
    try {
      await action();
    } catch (error) {
      console.error("Auth Action Error:", error);
    } finally {
      setIsPending(false);
    }
  }, []);

  const isLoading = status === "loading" || isPending;

  return (
    <motion.header 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="fixed top-0 w-full h-20 z-50 flex justify-center items-center px-4 bg-gray-900/80 backdrop-blur-md border-b border-white/10"
    >
      <div className="w-full max-w-7xl flex justify-between items-center">
        {/* ✅ Link com texto discernível para acessibilidade */}
        <Link 
          href="/" 
          className="flex items-center gap-2 text-blue-400 hover:text-white transition-colors"
          aria-label="Voltar para a página inicial"
        >
          <ArrowLeft size={20} aria-hidden="true" />
          <span>Início</span>
        </Link>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <Loader2 className="animate-spin text-blue-500" aria-label="Carregando..." />
          ) : session ? (
            <>
              <button 
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
                title="Ir para o Painel de Controle"
                aria-label="Ir para o Dashboard"
              >
                <LayoutDashboard size={18} aria-hidden="true" />
                <span className="hidden sm:inline">Painel</span>
              </button>
              
              {/* ✅ CORREÇÃO CRÍTICA: Botão de ícone agora tem label e title */}
              <button 
                onClick={() => executeAuthAction(() => signOut({ callbackUrl: "/" }))}
                className="text-red-400 hover:text-red-500 transition-colors p-2"
                title="Sair da conta"
                aria-label="Sair do sistema"
              >
                <LogOut size={20} aria-hidden="true" />
              </button>
            </>
          ) : (
            <button 
              onClick={() => executeAuthAction(() => signIn("google", { callbackUrl: "/dashboard" }))}
              className="flex items-center gap-2 bg-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all"
              title="Acessar com Google"
              aria-label="Entrar no sistema com conta Google"
            >
              <LogIn size={18} aria-hidden="true" />
              <span>Acessar</span>
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;