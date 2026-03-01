"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import heroImg from "../../public/assets/hero.png";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/header/header"; // Certifique-se de que o caminho está correto

/**
 * 🚀 NEXT.JS 15 - CONFIGURAÇÃO DINÂMICA
 * Como a Home usa useSearchParams e está no Root, o Next.js tenta torná-la estática.
 * 'force-dynamic' garante que o Header (com auth) e os SearchParams funcionem no build.
 */
export const dynamic = "force-dynamic";

/**
 * ✅ HOME PAGE WRAPPER
 * O uso de Suspense é obrigatório ao usar useSearchParams em Client Components
 * para evitar que toda a página seja desativada durante a hidratação.
 */
export default function HomePageWrapper() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <Header />
      <HomeContent />
    </Suspense>
  );
}

/**
 * 🏠 CONTEÚDO PRINCIPAL DA HOME
 */
const HomeContent = () => {
  const searchParams = useSearchParams();
  const [alertMessage, setAlertMessage] = useState("");

  // Memoriza a lógica de limpeza de alerta para evitar re-renderizações desnecessárias
  const clearAlert = useCallback(() => setAlertMessage(""), []);

  useEffect(() => {
    const msg = searchParams.get("message");
    if (msg) {
      setAlertMessage(msg);
      const timer = setTimeout(clearAlert, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, clearAlert]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col justify-center items-center px-6 py-12 overflow-hidden relative"
    >
      {/* Sistema de Notificação (Toast) */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 z-50 bg-red-600/90 text-white p-4 px-6 rounded-xl shadow-2xl backdrop-blur-md border border-red-400/30 flex items-center gap-3"
          >
            <AlertIcon />
            <span className="font-medium">{alertMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex flex-col justify-center items-center w-full max-w-7xl text-center px-4 z-10 mt-16">
        {/* Seção Hero com Imagem e Glow Effect */}
        <HeroSection />

        {/* Títulos Principais */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-white text-4xl sm:text-6xl font-extrabold leading-tight mb-8">
            <span className="bg-gradient-to-r from-blue-400 to-blue-100 bg-clip-text text-transparent">
              Organize seus estudos
            </span>
            <br />
            <span className="text-white">e tarefas com eficiência</span>
          </h1>

          <p className="text-blue-200 text-lg sm:text-xl max-w-2xl mb-12 mx-auto leading-relaxed">
            A plataforma definitiva para gerenciar seu tempo e aumentar sua produtividade.
          </p>
        </motion.div>

        {/* Estatísticas Rápidas */}
        <div className="flex flex-wrap justify-center gap-6 mt-4">
          <StatCard emoji="📚" label="+12 posts" />
          <StatCard emoji="💬" label="+90 comentários" />
        </div>
      </main>

      <BackgroundParticles />
    </motion.section>
  );
};

/* -------------------------------------------------------------------------- */
/* 🧩 SUB-COMPONENTES (Clean Code & Reutilização)                              */
/* -------------------------------------------------------------------------- */

const HeroSection = () => (
  <motion.div
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay: 0.2, duration: 0.8 }}
    className="mb-12 max-w-xs sm:max-w-md w-full relative"
  >
    <div className="absolute inset-0 bg-blue-500 rounded-full blur-[100px] opacity-20 -z-10 animate-pulse" />
    <Image
      alt="Ilustração Hero Tarefas+"
      src={heroImg}
      priority
      quality={100}
      className="w-full h-auto object-contain hover:scale-105 transition-transform duration-700"
    />
  </motion.div>
);

const StatCard = ({ emoji, label }: { emoji: string; label: string }) => (
  <motion.div
    whileHover={{ scale: 1.05, y: -5 }}
    className="bg-blue-600/10 backdrop-blur-md text-white py-6 px-8 rounded-2xl shadow-xl border border-blue-500/20 w-[220px]"
  >
    <div className="text-3xl mb-3">{emoji}</div>
    <span className="text-xl font-bold text-blue-100">{label}</span>
  </motion.div>
);

const BackgroundParticles = () => (
  <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
    {[...Array(15)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ opacity: [0, 0.4, 0], y: [0, -100] }}
        transition={{
          duration: 5 + Math.random() * 5,
          repeat: Infinity,
          delay: Math.random() * 5,
        }}
        className="absolute rounded-full bg-blue-400/20"
        style={{
          width: Math.random() * 8 + 4,
          height: Math.random() * 8 + 4,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
        }}
      />
    ))}
  </div>
);

const HomeLoading = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const AlertIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);