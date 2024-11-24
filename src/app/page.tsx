// react
import React from 'react';

// next libs
import Head from 'next/head';
import Image from 'next/image';

// images
import heroImg from '../../public/assets/hero.png';

// components
import Header from './header/page';

const Home = () => {
  return (
    <section >
    <Header/>
    <div className='w-full h-[calc(100vh-76px)] bg-black flex flex-col justify-center items-center'>
      <Head>
        <title>Board Tarefas</title>
      </Head>
      <main>
        <div className='flex flex-col justify-center items-center'>
          <Image className='max-w-480px w-auto h-auto object-contain xs:max-w-[80%]' alt='Logo Tarefas+' src={heroImg} priority/>
        </div>
        <h1 className='text-white text-center leading-normal m-7 xs:text-sm'>Sistema feito para você organizar seus estudos e tarefas</h1>
        <div className='text-black flex items-center justify-around xs:flex-col '>
          <section className='bg-white py-3.5 px-11 hover:scale-105 transition-transform durantion-400 text-center xs:w-[70%] xs:mb-5 cursor-pointer'>
            <span>+12 posts</span>
          </section>
          <section className='bg-white py-3.5 px-11 hover:scale-105 transition-transform durantion-400 text-center xs:w-[70%] xs:mb-5 cursor-pointer'>
            <span>+90 comentários</span>
          </section>
          
        </div>
      </main>
    </div>
    </section>
  )
}

export default Home;
