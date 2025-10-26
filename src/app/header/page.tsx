'use client';

import React, { useCallback, useState, useMemo } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

/**
 * ✅ Componente Header:
 * Responsável por exibir o cabeçalho da aplicação com o botão de login/logout.
 * Utiliza autenticação via NextAuth (Google OAuth).
 */
export default function Header() {
  // Hook do NextAuth que fornece informações sobre o usuário logado
  const { data: session, status } = useSession();

  // Estado local para controle de carregamento (login/logout)
  const [isLoading, setIsLoading] = useState(false);

  // Hooks do Next.js para navegação e controle de rota
  const router = useRouter();
  const pathname = usePathname();

  /**
   * ✅ Função que cria a URL absoluta de redirecionamento.
   * Isso evita erros em ambientes como Vercel e localhost.
   */
  const getAbsoluteUrl = useCallback((path: string) => {
    if (typeof window === 'undefined') return path;
    const baseUrl = window.location.origin;
    return `${baseUrl}${path}`;
  }, []);

  /**
   * ✅ Função para fazer login via Google OAuth.
   * Usa redirecionamento automático do NextAuth (sem `redirect: false`).
   */
  const handleLogin = useCallback(async () => {
    if (isLoading) return; // Evita múltiplos cliques
    setIsLoading(true);

    try {
      const callbackUrl = getAbsoluteUrl('/dashboard');
      // 🔹 Deixa o NextAuth controlar o redirecionamento
      await signIn('google', { callbackUrl });
    } catch (err) {
      console.error('Erro ao fazer login:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getAbsoluteUrl, isLoading]);

  /**
   * ✅ Função para logout.
   * Redireciona o usuário para a home após sair.
   */
  const handleLogout = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const callbackUrl = getAbsoluteUrl('/');
      await signOut({ callbackUrl });
    } catch (err) {
      console.error('Erro ao sair:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getAbsoluteUrl, isLoading]);

  /**
   * ✅ Determina se o botão deve exibir “Acessar” ou “Sair”.
   * Também controla se o botão está desabilitado durante carregamento.
   */
  const buttonLabel = useMemo(() => {
    if (isLoading) return 'Carregando...';
    return session ? 'Sair' : 'Acessar';
  }, [session, isLoading]);

  /**
   * ✅ Define a ação do botão de forma declarativa.
   */
  const handleButtonClick = useCallback(() => {
    if (session) {
      handleLogout();
    } else {
      handleLogin();
    }
  }, [session, handleLogin, handleLogout]);

  /**
   * ✅ Evita exibir o header em páginas específicas (ex: login).
   * Caso queira sempre exibir, remova este trecho.
   */
  if (pathname === '/login') return null;

  return (
    <header className="w-full flex items-center justify-between p-4 bg-gray-900 text-white shadow-md">
      {/* Logo animado com Framer Motion */}
      <motion.h1
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="text-2xl font-bold select-none"
      >
        BoardTarefas
      </motion.h1>

      {/* Área do usuário */}
      <div className="flex items-center gap-4">
        {/* Exibe nome do usuário se logado */}
        {session?.user?.name && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="hidden sm:inline-block font-medium"
          >
            {session.user.name}
          </motion.span>
        )}

        {/* Botão de login/logout */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isLoading}
          onClick={handleButtonClick}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            session
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {buttonLabel}
        </motion.button>
      </div>
    </header>
  );
}
