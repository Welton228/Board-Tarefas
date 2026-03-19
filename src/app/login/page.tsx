"use client";

import React from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import Header from "../../components/header/header"; 
import { motion, AnimatePresence } from "framer-motion";
import { FiLoader, FiLogIn, FiLayers, FiArrowRight } from "react-icons/fi";
import { FaGoogle } from "react-icons/fa";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const { data: session, status } = useSession();

  // 1. ESTADO DE LOADING (Nexus Style)
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="mb-4"
        >
          <FiLoader className="w-10 h-10 text-blue-500" />
        </motion.div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 animate-pulse">
          Sincronizando Nexus...
        </p>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-gray-900 via-black to-black flex flex-col items-center justify-center px-6 overflow-hidden selection:bg-blue-500/30">
      <Header />

      {/* 🌌 ELEMENTOS VISUAIS DE FUNDO */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 blur-[130px] rounded-full -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 blur-[130px] rounded-full -z-10" />

      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white/2 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 sm:p-14 shadow-2xl text-center relative z-10 overflow-hidden"
      >
        {/* Detalhe de luz no topo do card */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-linear-to-r from-transparent via-blue-500/50 to-transparent" />

        {/* 🚀 BRANDING INTERNO */}
        <div className="flex flex-col items-center gap-6 mb-12">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-transform hover:scale-110 duration-500">
            <FiLayers className="text-white text-3xl" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-white">
              Nexus <span className="text-blue-500 font-light italic">Auth</span>
            </h1>
            <div className="h-px w-12 bg-blue-500/30 mx-auto mt-2" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {session ? (
            /* ✅ INTERFACE PARA USUÁRIO JÁ LOGADO */
            <motion.div 
              key="logged-in"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <p className="text-gray-400 text-sm font-light">Identificamos sua conexão como:</p>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {session.user?.name}
                </h2>
              </div>

              <Link
                href="/dashboard"
                className="group flex items-center justify-center gap-3 w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all active:scale-95 cursor-pointer"
              >
                <span>Acessar Dashboard</span>
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
              </Link>
            </motion.div>
          ) : (
            /* 🔐 INTERFACE PARA FAZER LOGIN */
            <motion.div 
              key="logged-out"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="space-y-3">
                <h2 className="text-white text-2xl font-black tracking-tighter uppercase">Bem-vindo</h2>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-[0.2em]">
                  Sincronize sua conta Google
                </p>
              </div>

              <button
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="group flex items-center justify-center gap-4 w-full bg-white text-black py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all duration-500 shadow-xl cursor-pointer active:scale-95"
              >
                <FaGoogle className="text-lg group-hover:rotate-360 transition-transform duration-1000" />
                <span>Entrar no Sistema</span>
              </button>

              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                Ambiente seguro & criptografado
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </main>
  );
}