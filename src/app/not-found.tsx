import React from "react";
import Link from "next/link";
import Header from "../components/header/header"; // 💡 Importação limpa usando Alias
import { FileQuestion, Home } from "lucide-react"; // Ícones para melhor UX

/**
 * 🚀 NEXT.JS 15 - NOT FOUND PAGE
 * * Por que 'force-dynamic'? 
 * O Header/Layout usa sessão (cookies). No build, o Next.js tenta gerar o 404 estático.
 * Como não há cookies no build, o auth() falha. 'force-dynamic' pula essa pré-renderização.
 */
export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-black text-white px-4">
      {/* 🧩 Componente Header isolado para manter consistência visual */}
      <Header />

      <section className="flex flex-col items-center text-center max-w-md animate-in fade-in zoom-in duration-500">
        {/* 🎨 Feedback Visual: Ícone de erro amigável */}
        <div className="bg-blue-600/10 p-6 rounded-full mb-8 border border-blue-500/20">
          <FileQuestion className="w-16 h-16 text-blue-500" />
        </div>

        <h1 className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 mb-4">
          404
        </h1>

        <h2 className="text-2xl font-semibold mb-4 tracking-tight">
          Página não encontrada
        </h2>

        <p className="text-gray-400 mb-10 leading-relaxed">
          Parece que o link que você seguiu está quebrado ou a página foi movida para um novo endereço. 
          Que tal voltar para o início e tentar novamente?
        </p>

        {/* 🔗 Navegação segura e acessível */}
        <Link
          href="/"
          className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-900/20 transition-all hover:scale-105 active:scale-95"
        >
          <Home className="w-5 h-5 group-hover:animate-bounce" />
          Voltar para a Página Inicial
        </Link>
      </section>

      {/* 🌫️ Background Decorativo (opcional, mantendo o estilo do seu projeto) */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full" />
      </div>
    </main>
  );
}