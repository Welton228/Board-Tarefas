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
    <section className="min-h-screen bg-gradient-to-br from-purple-800 via-indigo-900 to-blue-800 flex flex-col justify-center items-center p-6">
      {/* Mensagem de alerta, se houver */}
      {message && (
        <div className="bg-red-600 text-white p-4 rounded-xl shadow-lg mb-6 transform transition-all duration-500 opacity-0 animate-messageAppear">
          {message}
        </div>
      )}

      <main className="flex flex-col justify-center items-center w-full max-w-7xl">
        {/* Imagem Hero */}
        <div className="flex flex-col justify-center items-center mb-8 w-full max-w-[480px]">
          <Image
            alt="Logo Tarefas+"
            src={heroImg}
            priority
            quality={85}
            placeholder="blur"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 480px"
            className="w-full h-auto object-contain transform transition-all duration-700 ease-in-out hover:scale-105"
          />
        </div>

        <h1 className="text-white text-4xl sm:text-3xl text-center font-bold leading-normal mx-7 mb-6 animate-fadeIn">
          Organize seus estudos e tarefas de forma simples e eficiente
        </h1>

        <div className="flex items-center justify-center space-x-6 w-full xs:flex-col">
          <section className="bg-gradient-to-r from-gray-800 to-gray-700 text-white py-4 px-12 rounded-xl shadow-xl text-lg font-semibold text-center xs:w-[70%] xs:mb-5 hover:scale-105 transition-transform duration-300 cursor-pointer transform hover:translate-y-[-6px] hover:shadow-2xl">
            <span>+12 posts</span>
          </section>
          <section className="bg-gradient-to-r from-gray-800 to-gray-700 text-white py-4 px-12 rounded-xl shadow-xl text-lg font-semibold text-center xs:w-[70%] xs:mb-5 hover:scale-105 transition-transform duration-300 cursor-pointer transform hover:translate-y-[-6px] hover:shadow-2xl">
            <span>+90 comentários</span>
          </section>
        </div>
      </main>
    </section>
  );
};

export default Home;
