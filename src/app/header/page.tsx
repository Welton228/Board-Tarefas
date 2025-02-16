
//react
import React from 'react'

//next libs
import Link from 'next/link';
import { useSession, signIn, signOut } from "next-auth/react";
const Header = () => {

  const { data: session, status } = useSession();

  return (
    <header className="w-full h-20 bg-gradient-to-r from-purple-600 to-blue-500 flex justify-center items-center p-4">
  <section className="w-full max-w-5xl flex items-center justify-between">
    <nav className="flex items-center">
      <Link href="/" className="no-underline">
        <h1 className="text-white text-3xl font-semibold drop-shadow-md">
          Tarefas <span className="text-red-500 pl-0.5">+</span>
        </h1>
      </Link>
      {session?.user && (
        <Link
          href="/dashboard"
          className="no-underline text-black bg-white py-2 px-6 mx-4 rounded-full sm:text-sm hover:bg-gray-100 hover:text-black transition duration-300"
        >
          Meu painel
        </Link>
      )}
    </nav>

    {status === "loading" ? (
      <></>
    ) : session ? (
      <button
        className="text-white bg-transparent py-2 px-8 rounded-3xl hover:bg-white hover:text-black border-2 border-solid border-white hover:scale-110 transition-transform duration-500 hover:border-gray-500 hover:font-medium sm:text-sm sm:px-4"
        onClick={() => signOut()}
      >
        Olá, {session.user?.name} <span className="text-red-500 pl-0.5">+</span>
      </button>
    ) : (
      <button
        className="text-white bg-transparent py-2 px-8 rounded-3xl hover:bg-white hover:text-black border-2 border-solid border-white hover:scale-110 transition-transform duration-500 hover:border-gray-500 hover:font-medium sm:text-sm sm:px-4"
        onClick={() => signIn("google")}
      >
        Acessar <span className="text-red-500 pl-0.5">+</span>
      </button>
    )}
  </section>
</header>

  )
}

export default Header