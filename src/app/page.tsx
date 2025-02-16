'use client';

// React
import React, { useEffect, useState } from 'react';

// Next.js libs
import Head from 'next/head';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

// Images
import heroImg from '../../public/assets/hero.png';

const Home = () => {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");

  useEffect(() => {
    const msg = searchParams.get("message"); // Captura a mensagem da URL
    if (msg) {
      setMessage(msg); // Armazena no estado para exibição
    }
  }, [searchParams]);

  return (
    <section>
  <div className="w-full h-[calc(100vh-76px)] bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col justify-center items-center p-6">
    <Head>
      <title>Board Tarefas</title>
    </Head>

    {/* Exibe a mensagem de alerta, se houver */}
    {message && (
      <div className="bg-red-600 text-white p-4 rounded-xl shadow-lg mb-6 transition-all duration-300">
        {message}
      </div>
    )}

    <main className="flex flex-col justify-center items-center w-full">
      {/* Logo da aplicação */}
      <div className="flex flex-col justify-center items-center mb-8">
        <Image
          className="max-w-[480px] w-auto h-auto object-contain xs:max-w-[80%]"
          alt="Logo Tarefas+"
          src={heroImg}
          priority
        />
      </div>

      {/* Texto descritivo */}
      <h1 className="text-white text-3xl sm:text-xl text-center leading-normal mx-7 xs:text-sm mb-6">
        Sistema feito para você organizar seus estudos e tarefas
      </h1>

      {/* Informações sobre a plataforma */}
      <div className="flex items-center justify-center space-x-6 w-full xs:flex-col">
        <section className="bg-white py-4 px-12 rounded-xl shadow-xl text-black text-lg font-semibold text-center xs:w-[70%] xs:mb-5 hover:scale-105 transition-transform duration-300 cursor-pointer">
          <span>+12 posts</span>
        </section>
        <section className="bg-white py-4 px-12 rounded-xl shadow-xl text-black text-lg font-semibold text-center xs:w-[70%] xs:mb-5 hover:scale-105 transition-transform duration-300 cursor-pointer">
          <span>+90 comentários</span>
        </section>
      </div>
    </main>
  </div>
</section>
  );
};

export default Home;
