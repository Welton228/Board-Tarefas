'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from "next-auth/react";
import { UserCircle2, LogIn, ArrowLeft } from 'lucide-react'; // Ícones

const Header = () => {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Pega a inicial do nome do usuário
  const getInitial = (name?: string | null) => {
    return name ? name.charAt(0).toUpperCase() : '';
  };

  return (
    <header
      className={`fixed top-0 w-full h-20 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900/70 backdrop-blur-md shadow-lg'
          : 'bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-800'
      } flex justify-center items-center p-4`}
    >
      <section className="w-full max-w-6xl flex items-center justify-between">
        {/* Navegação à esquerda */}
        <nav className="flex items-center space-x-4 sm:space-x-6">
          <Link href="/" className="no-underline flex items-center space-x-2">
            {/* Ícone de seta */}
            <ArrowLeft className="text-white w-6 h-6" />
            {/* Texto "Início" aparece só em telas maiores */}
            <span className="text-white text-lg font-medium hidden sm:inline">Início</span>
          </Link>

          {session?.user && (
            <Link
              href="/dashboard"
              className="no-underline text-black bg-white py-2 px-4 rounded-full text-sm hover:bg-gray-100 hover:text-black transition-all duration-300 shadow-xl transform hover:scale-105"
            >
              Meu painel
            </Link>
          )}
        </nav>

        {/* Área do usuário à direita */}
        {status === "loading" ? null : session ? (
          <div className="flex items-center space-x-4">
            {/* Círculo com inicial e nome completo no desktop */}
            <span className="flex items-center text-white text-lg animate-fade-in">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20 text-white font-bold text-sm sm:w-10 sm:h-10 sm:text-base">
                {getInitial(session.user?.name)}
              </div>
              {/* Nome completo só aparece em telas maiores */}
              <span className="ml-2 hidden sm:inline font-medium">
                {session.user?.name}
              </span>
            </span>
            <button
              className="text-white bg-transparent py-2 px-4 sm:px-6 rounded-3xl hover:bg-white hover:text-black border-2 border-white hover:scale-110 transition-transform duration-500 hover:border-gray-500 text-sm sm:text-base"
              onClick={() => signOut()}
            >
              Sair
            </button>
          </div>
        ) : (
          <button
            className="flex items-center gap-2 text-white bg-transparent py-2 px-4 sm:px-6 rounded-3xl hover:bg-white hover:text-black border-2 border-white hover:scale-110 transition-transform duration-500 hover:border-gray-500 text-sm sm:text-base"
            onClick={() => signIn("google")}
          >
            <LogIn className="w-5 h-5" />
            {/* Texto "Acessar +" aparece só em telas maiores */}
            <span className="hidden sm:inline">
              Acessar <span className="text-red-500 pl-0.5">+</span>
            </span>
          </button>
        )}
      </section>
    </header>
  );
};

export default Header;
