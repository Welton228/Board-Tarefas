'use client';
// react
import React from "react";

// Next libs
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Head from 'next/head';

const Dashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Se o estado estiver carregando, exibe um carregamento
  if (status === "loading") {
    return <div>Carregando...</div>;
  }

  // Se o usuário não estiver autenticado, redireciona para a home
  if (!session) {
    router.push("/?message=Acesso negado! Faça login primeiro.");
    return null; // Retorna null enquanto o redirecionamento ocorre
  }

  return (
    <div>
      <Head>
        <title>Dashboard</title>
      </Head>
      <h1>Bem-vindo ao Painel, {session.user?.name}!</h1>
    </div>
  );
};

export default Dashboard;

