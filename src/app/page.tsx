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
      <div className='w-full h-[calc(100vh-76px)] bg-black flex flex-col justify-center items-center'>
        <Head>
          <title>Board Tarefas</title>
        </Head>
        
        {/* Exibe a mensagem de alerta, se houver */}
        {message && (
          <div className="bg-red-600 text-white p-3 rounded-md mb-4">
            {message}
          </div>
        )}

        <main>
          <div className='flex flex-col justify-center items-center'>
            <Image 
              className='max-w-480px w-auto h-auto object-contain xs:max-w-[80%]' 
              alt='Logo Tarefas+' 
              src={heroImg} 
              priority
            />
          </div>
          
          <h1 className='text-white text-center leading-normal m-7 xs:text-sm'>
            Sistema feito para você organizar seus estudos e tarefas
          </h1>
          
          <div className='text-black flex items-center justify-around xs:flex-col'>
            <section className='bg-white py-3.5 px-11 hover:scale-105 transition-transform duration-400 text-center xs:w-[70%] xs:mb-5 cursor-pointer'>
              <span>+12 posts</span>
            </section>
            <section className='bg-white py-3.5 px-11 hover:scale-105 transition-transform duration-400 text-center xs:w-[70%] xs:mb-5 cursor-pointer'>
              <span>+90 comentários</span>
            </section>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Home;
