"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import heroImg from "../../public/assets/hero.png";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/header/header"; 
import { FiAlertTriangle, FiActivity, FiMessageSquare, FiLayout } from "react-icons/fi";

export const dynamic = "force-dynamic";

export default function HomePageWrapper() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <Header />
      <HomeContent />
    </Suspense>
  );
}

const HomeContent = () => {
  const searchParams = useSearchParams();
  const [alertMessage, setAlertMessage] = useState("");

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
      className="min-h-screen bg-[radial-gradient(ellipse_at_bottom,var(--tw-gradient-stops))] from-gray-900 via-black to-black flex flex-col justify-center items-center px-6 py-12 overflow-hidden relative selection:bg-blue-500/30"
    >
      {/* 🚨 NOTIFICAÇÃO PREMIUM */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-28 z-70 bg-red-500/10 backdrop-blur-2xl text-red-400 p-4 px-8 rounded-2xl shadow-[0_0_40px_rgba(239,68,68,0.15)] border border-red-500/20 flex items-center gap-4"
          >
            <FiAlertTriangle className="text-xl" />
            <span className="font-bold text-xs uppercase tracking-widest">{alertMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative flex flex-col justify-center items-center w-full max-w-7xl text-center px-4 z-10 mt-20">
        
        {/* ✨ HERO ILLUSTRATION */}
        <HeroSection />

        {/* ✍️ TEXTOS PRINCIPAIS */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Sistema Nexus Ativo</span>
          </div>

          <h1 className="text-white text-5xl sm:text-7xl font-black leading-[1.1] mb-8 tracking-tighter">
            Organize seus estudos <br />
            <span className="bg-linear-to-r from-blue-400 via-indigo-400 to-blue-600 bg-clip-text text-transparent">
              com inteligência superior
            </span>
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mb-14 mx-auto leading-relaxed font-light">
            A plataforma definitiva para gerenciar seu tempo, <br className="hidden sm:block" /> 
            centralizar tarefas e maximizar sua produtividade diária.
          </p>
        </motion.div>

        {/* 📊 ESTATÍSTICAS (GLASS CARDS) */}
        <div className="flex flex-wrap justify-center gap-6 mt-4">
          <StatCard 
            icon={<FiLayout className="text-blue-400" />} 
            label="Projetos" 
            value="+12" 
            delay={0.6}
          />
          <StatCard 
            icon={<FiMessageSquare className="text-indigo-400" />} 
            label="Feedback" 
            value="+90" 
            delay={0.7}
          />
        </div>
      </main>

      {/* 🌌 ELEMENTOS VISUAIS DE FUNDO */}
      <BackgroundElements />
    </motion.section>
  );
};

/* -------------------------------------------------------------------------- */
/* 🧩 COMPONENTES DE APOIO (NEXUS STYLE)                                      */
/* -------------------------------------------------------------------------- */

const HeroSection = () => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
    className="mb-12 max-w-sm sm:max-w-lg w-full relative"
  >
    {/* Glow central dinâmico */}
    <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-[140px] -z-10" />
    <Image
      alt="Nexus Hero"
      src={heroImg}
      priority
      quality={100}
      className="w-full h-auto object-contain drop-shadow-[0_0_50px_rgba(37,99,235,0.2)]"
    />
  </motion.div>
);

const StatCard = ({ icon, label, value, delay }: { icon: any; label: string; value: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ y: -8, transition: { duration: 0.2 } }}
    className="bg-white/3 backdrop-blur-xl py-8 px-10 rounded-[2.5rem] border border-white/10 w-64 shadow-2xl relative group overflow-hidden"
  >
    <div className="absolute inset-0 bg-linear--to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="text-2xl mb-4 relative z-10">{icon}</div>
    <div className="flex flex-col relative z-10">
      <span className="text-3xl font-black text-white tracking-tighter">{value}</span>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{label}</span>
    </div>
  </motion.div>
);

const BackgroundElements = () => (
  <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
    {/* Círculos de luz estáticos */}
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[150px] rounded-full" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 blur-[150px] rounded-full" />
    
    {/* Partículas flutuantes */}
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ 
          opacity: [0, 0.3, 0], 
          y: [0, -200],
          x: [0, (i % 2 === 0 ? 50 : -50)] 
        }}
        transition={{
          duration: 7 + Math.random() * 10,
          repeat: Infinity,
          delay: Math.random() * 5,
        }}
        className="absolute rounded-full bg-white/10"
        style={{
          width: Math.random() * 4 + 1,
          height: Math.random() * 4 + 1,
          top: `${70 + Math.random() * 30}%`,
          left: `${Math.random() * 100}%`,
        }}
      />
    ))}
  </div>
);

const HomeLoading = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);