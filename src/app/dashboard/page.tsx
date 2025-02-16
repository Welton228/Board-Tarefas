'use client';
// react
import React from "react";

// components
import Textarea from "@/app/textarea/page";

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
      <Textarea/>
    </div>
  );
};

export default Dashboard;

