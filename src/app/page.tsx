import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import heroImg from '../../public/assets/hero.png';

const Home = () => {
  return (
    <div className='w-full h-screen bg-black flex flex-col justify-center items-center'>
      <Head>
        <title>Board Tarefas</title>
      </Head>
      <main>
        <div className='flex flex-col justify-center items-center'>
          <Image className='max-w-480px w-auto h-auto object-contain' alt='Logo Tarefas+' src={heroImg} priority/>
        </div>
        <h1 className='text-white text-center leading-normal m-7'>Sistema feito para você organizar seus estudos e tarefas</h1>
      </main>
    </div>
  )
}

export default Home;
