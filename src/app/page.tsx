'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import heroImg from '../../public/assets/hero.png';
import { motion, AnimatePresence } from 'framer-motion';

const Home = () => {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");

  // Efeito para verificar mensagens na URL
  useEffect(() => {
    const msg = searchParams.get("message");
    if (msg) {
      setMessage(msg);
      // Remove a mensagem após 5 segundos
      const timer = setTimeout(() => setMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col justify-center items-center px-6 py-12 overflow-hidden"
    >
      {/* Mensagem de alerta animada */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ type: 'spring', damping: 25 }}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 px-6 rounded-xl shadow-2xl mb-8 backdrop-blur-sm border border-red-400/30"
          >
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conteúdo principal */}
      <main className="flex flex-col justify-center items-center w-full max-w-7xl text-center px-4">
        {/* Imagem principal com efeitos premium */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-12 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg w-full relative"
        >
          <div className="absolute inset-0 bg-blue-500 rounded-full blur-3xl opacity-20 -z-10 animate-pulse-slow" />
          <Image
            alt="Logo Tarefas+"
            src={heroImg}
            priority
            quality={100}
            placeholder="blur"
            sizes="100vw"
            className="w-full h-auto object-contain transition-all duration-700 hover:scale-105 hover:drop-shadow-glow"
          />
        </motion.div>

        {/* Título principal com gradiente animado */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-white text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-8"
        >
          <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-200 bg-clip-text text-transparent">
            Organize seus estudos 
          </span>
          <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-200 via-blue-100 to-white bg-clip-text text-transparent">
            e tarefas com eficiência
          </span>
        </motion.h1>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-blue-200 text-lg sm:text-xl max-w-2xl mb-12"
        >
          A plataforma definitiva para gerenciar seu tempo e aumentar sua produtividade
        </motion.p>

        {/* Destaques com efeito 3D */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex flex-wrap justify-center items-center gap-6 w-full max-w-3xl mt-4"
        >
          {/* Card 1 */}
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-br from-blue-600/30 to-blue-800/30 backdrop-blur-md text-white py-6 px-8 rounded-2xl shadow-2xl font-semibold text-lg transition-all duration-300 border border-blue-500/30 w-[220px] text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-blue-500/10 -z-10" />
            <div className="text-3xl mb-3">📚</div>
            <span className="block text-xl font-bold bg-gradient-to-r from-blue-200 to-blue-100 bg-clip-text text-transparent">+12 posts</span>
            <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-br from-blue-600/30 to-blue-800/30 backdrop-blur-md text-white py-6 px-8 rounded-2xl shadow-2xl font-semibold text-lg transition-all duration-300 border border-blue-500/30 w-[220px] text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-blue-500/10 -z-10" />
            <div className="text-3xl mb-3">💬</div>
            <span className="block text-xl font-bold bg-gradient-to-r from-blue-200 to-blue-100 bg-clip-text text-transparent">+90 comentários</span>
            <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />
          </motion.div>
        </motion.div>

        {/* Efeitos de partículas no fundo */}
        <div className="absolute inset-0 overflow-hidden -z-20">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{
                duration: 5 + Math.random() * 10,
                repeat: Infinity,
                delay: Math.random() * 5
              }}
              className="absolute rounded-full bg-blue-400"
              style={{
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      </main>
    </motion.section>
  );
};

export default Home;