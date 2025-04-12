import React from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from "next-auth/react";

const Header = () => {
  const { data: session, status } = useSession();

  return (
    <header className="w-full h-20 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-800 flex justify-center items-center p-4 shadow-2xl">
      <section className="w-full max-w-5xl flex items-center justify-between">
        {/* Navegação */}
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

        {/* Botão de login ou logout */}
        {status === "loading" ? (
          <></>
        ) : session ? (
          <button
            className="text-white bg-transparent py-3 px-10 rounded-3xl hover:bg-white hover:text-black border-2 border-solid border-white hover:scale-110 transition-transform duration-500 hover:border-gray-500 hover:font-medium sm:text-sm sm:px-6"
            onClick={() => signOut()}
          >
            Olá, {session.user?.name} <span className="text-red-500 pl-0.5">+</span>
          </button>
        ) : (
          <button
            className="text-white bg-transparent py-3 px-10 rounded-3xl hover:bg-white hover:text-black border-2 border-solid border-white hover:scale-110 transition-transform duration-500 hover:border-gray-500 hover:font-medium sm:text-sm sm:px-6"
            onClick={() => signIn("google")}
          >
            Acessar <span className="text-red-500 pl-0.5">+</span>
          </button>
        )}
      </section>
    </header>
  );
};

export default Header;
