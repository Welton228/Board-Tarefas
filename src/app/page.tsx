"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import heroImg from "../../public/assets/hero.png";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/header/header"; 

/**
 * 🚀 NEXT.JS 15 - CONFIGURAÇÃO DINÂMICA
 * Força a renderização dinâmica para garantir que o Header (auth) 
 * e os SearchParams funcionem corretamente no build da Vercel.
 */
export const dynamic = "force-dynamic";

/**
 * ✅ HOME PAGE WRAPPER
 * Envolve o conteúdo em Suspense, requisito obrigatório no Next.js 15 
 * ao consumir hooks como useSearchParams em Client Components.
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

  // Memoriza a limpeza do alerta para evitar recriação da função
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
      /* ✅ Tailwind v4: bg-linear-to-br */
      className="min-h-screen bg-linear-to-br from-gray-950 via-blue-950 to-gray-950 flex flex-col justify-center items-center px-6 py-12 overflow-hidden relative"
    >
      {/* Sistema de Notificação (Toast Customizado) */}
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
        {/* Seção Hero com efeito de Glow */}
        <HeroSection />

        {/* Textos Principais */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-white text-4xl sm:text-6xl font-extrabold leading-tight mb-8">
            {/* ✅ Tailwind v4: bg-linear-to-r */}
            <span className="bg-linear-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              Organize seus estudos
            </span>
            <br />
            <span className="text-white">e tarefas com eficiência</span>
          </h1>

          <p className="text-blue-200/80 text-lg sm:text-xl max-w-2xl mb-12 mx-auto leading-relaxed">
            A plataforma definitiva para gerenciar seu tempo e aumentar sua produtividade.
          </p>
        </motion.div>

        {/* Cards de Estatísticas */}
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
/* 🧩 SUB-COMPONENTES                                                         */
/* -------------------------------------------------------------------------- */

const HeroSection = () => (
  <motion.div
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay: 0.2, duration: 0.8 }}
    className="mb-12 max-w-xs sm:max-w-md w-full relative"
  >
    {/* Efeito de brilho atrás da imagem */}
    <div className="absolute inset-0 bg-blue-600 rounded-full blur-[120px] opacity-20 -z-10 animate-pulse" />
    <Image
      alt="Ilustração Hero"
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
    /* ✅ Atualizado: w-55 em vez de w-[220px] */
    className="bg-white/5 backdrop-blur-md text-white py-6 px-8 rounded-2xl shadow-xl border border-white/10 w-55"
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
        animate={{ opacity: [0, 0.4, 0], y: [0, -150] }}
        transition={{
          duration: 5 + Math.random() * 5,
          repeat: Infinity,
          delay: Math.random() * 5,
        }}
        className="absolute rounded-full bg-blue-400/10"
        style={{
          width: Math.random() * 10 + 2,
          height: Math.random() * 10 + 2,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
        }}
      />
    ))}
  </div>
);

const HomeLoading = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const AlertIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);