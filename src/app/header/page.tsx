'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from "next-auth/react";
import { UserCircle2, LogIn } from 'lucide-react'; // Ícones minimalistas

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
        <nav className="flex items-center space-x-8">
          <Link href="/" className="no-underline">
            <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 text-4xl font-bold drop-shadow-lg hover:scale-105 transition-all duration-300">
              Tarefas <span className="text-red-500 pl-0.5">+</span>
            </h1>
          </Link>

          {session?.user && (
            <Link
              href="/dashboard"
              className="no-underline text-black bg-white py-3 px-8 rounded-full sm:text-sm hover:bg-gray-100 hover:text-black transition-all duration-300 shadow-xl transform hover:scale-105"
            >
              Meu painel
            </Link>
          )}
        </nav>

        {/* Área do usuário à direita */}
        {status === "loading" ? null : session ? (
          <div className="flex items-center space-x-4">
            {/* Nome com animação e ícone */}
            <span className="flex items-center text-white text-lg animate-fade-in">
              <UserCircle2 className="w-6 h-6 mr-2 text-white/90" />
              <span className="font-medium">{session.user?.name}</span>
            </span>
            <button
              className="text-white bg-transparent py-2 px-6 rounded-3xl hover:bg-white hover:text-black border-2 border-solid border-white hover:scale-110 transition-transform duration-500 hover:border-gray-500 hover:font-medium sm:text-sm"
              onClick={() => signOut()}
            >
              Sair
            </button>
          </div>
        ) : (
          <button
            className="flex items-center gap-2 text-white bg-transparent py-2 px-8 rounded-3xl hover:bg-white hover:text-black border-2 border-solid border-white hover:scale-110 transition-transform duration-500 hover:border-gray-500 hover:font-medium sm:text-sm sm:px-6"
            onClick={() => signIn("google")}
          >
            <LogIn className="w-5 h-5" />
            Acessar <span className="text-red-500 pl-0.5">+</span>
          </button>
        )}
      </section>
    </header>
  );
};

export default Header;
