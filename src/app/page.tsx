// Exemplo de renderização dinâmica
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import heroImg from '../../public/assets/hero.png';

const Home = () => {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");

  useEffect(() => {
    const msg = searchParams.get("message");
    if (msg) {
      setMessage(msg);
    }
  }, [searchParams]);

  return (
    <section className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900/70 flex flex-col justify-center items-center px-6 py-12">
      {/* Alerta (caso exista mensagem na URL) */}
      {message && (
        <div className="bg-red-600 text-white p-4 px-6 rounded-xl shadow-lg mb-6 animate-messageAppear">
          {message}
        </div>
      )}

      <main className="flex flex-col justify-center items-center w-full max-w-7xl text-center">
        {/* Imagem principal com efeito */}
        <div className="mb-10 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg w-full">
          <Image
            alt="Logo Tarefas+"
            src={heroImg}
            priority
            quality={85}
            placeholder="blur"
            sizes="100vw"
            className="w-full h-auto object-contain transition-transform duration-500 hover:scale-105 hover:brightness-110"
          />
        </div>

        {/* Título principal */}
        <h1 className="text-white text-4xl sm:text-5xl font-extrabold leading-tight mb-6 drop-shadow-lg animate-fadeIn">
          Organize seus estudos <br className="hidden sm:inline" />
          e tarefas com eficiência
        </h1>

        {/* Destaques com efeito 3D e responsividade */}
        <div className="flex flex-wrap justify-center items-center gap-6 w-full max-w-2xl mt-4">
          <div className="bg-white/10 backdrop-blur-md text-white py-5 px-10 rounded-2xl shadow-xl font-semibold text-lg hover:scale-105 transform hover:-translate-y-2 transition-all duration-300 border border-white/20 w-[220px] text-center">
            📚 <span className="block mt-2">+12 posts</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md text-white py-5 px-10 rounded-2xl shadow-xl font-semibold text-lg hover:scale-105 transform hover:-translate-y-2 transition-all duration-300 border border-white/20 w-[220px] text-center">
            💬 <span className="block mt-2">+90 comentários</span>
          </div>
        </div>
      </main>
    </section>
  );
};

export default Home;
