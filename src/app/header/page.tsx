
//react
import React from 'react'

//next libs
import Link from 'next/link';
const Header = () => {
  return (
    <header className='w-full h-76 bg-black flex justify-center items-center'>
        <section className='px-18 w-full max-w-5xl flex items-center justify-between'>
            <nav className='flex items-center'>
              <Link href={'/'} className='no-underline '>
              <h1 className='text-white text-2xl sm:text-sm'>Tarefas <span className='text-red-500 pl-0.5'>+</span></h1>
              </Link>
              <Link href={'/dashboard'} className='no-underline text-black bg-white py-1 px-3.5 mx-3.5 rounded sm:text-sm sm:px-2'>
              Meu painel
              </Link>
            </nav>
            <button className='text-white bg-transparent py-2 px-8 rounded-3xl hover:bg-white hover:text-black border-2 border-solid border-white hover:scale-110 transition-transform duration-500 hover:border-gray-500 hover:font-medium sm:text-sm sm:px-4'>Acessar <span className='text-red-500 pl-0.5'>+</span></button>
        </section>
    </header>
  )
}

export default Header