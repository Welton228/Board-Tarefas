'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { FiLogOut, FiRefreshCw, FiEdit2, FiTrash2, FiCheck, FiPlus } from "react-icons/fi";

// Importações de componentes de UI
import CreateTaskForm from "../../createTaskUi/page";
import TaskForm from "../../taskForm/page";

/**
 * 🛠️ DASHBOARD CONTENT (REFATORADO PARA ACESSIBILIDADE)
 * Resolvido: Erros de 'button-type' e 'discernible text' para leitores de tela.
 */
const DashboardContent = () => {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);

  const fetchTasks = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const response = await fetch("/api/tasks");
      if (response.status === 401) {
        await update(); 
        return;
      }
      const data = await response.json();
      if (isMounted.current) setTasks(data);
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [status, update]);

  useEffect(() => {
    isMounted.current = true;
    if (status === "authenticated") fetchTasks();
    return () => { isMounted.current = false; };
  }, [status, fetchTasks]);

  if (status === "loading") return <LoadingScreen />;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center bg-gray-900/50 backdrop-blur-md p-6 rounded-2xl border border-gray-800">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Nexus Task
          </h1>
          <p className="text-sm text-gray-400">Dashboard de {session.user?.name}</p>
        </div>

        {/* CORREÇÃO: Adicionado type="button" e aria-label */}
        <button 
          type="button" 
          aria-label="Sair da conta"
          title="Sair da conta"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-2"
        >
          <FiLogOut />
          <span className="hidden md:inline">Sair</span>
        </button>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-1 bg-gray-900/50 p-6 rounded-2xl border border-gray-800 h-fit">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FiPlus className="text-blue-400" /> Nova Tarefa
          </h2>
          <CreateTaskForm onTaskCreated={fetchTasks} />
        </section>

        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Minhas Tarefas</h2>
            
            {/* CORREÇÃO: Adicionado type="button" e title para o ícone de refresh */}
            <button 
              type="button"
              aria-label="Atualizar lista de tarefas"
              title="Atualizar lista"
              onClick={fetchTasks} 
              disabled={loading}
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 flex items-center justify-between">
                <span className={task.completed ? "line-through text-gray-500" : ""}>
                  {task.title}
                </span>
                <div className="flex gap-2">
                  {/* CORREÇÃO: Todos os botões de ação com type e labels */}
                  <button type="button" aria-label="Editar" title="Editar" className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg">
                    <FiEdit2 />
                  </button>
                  <button type="button" aria-label="Excluir" title="Excluir" className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

const LoadingScreen = () => (
  <div className="h-screen flex items-center justify-center bg-gray-950 text-blue-500">
    <FiRefreshCw className="animate-spin text-4xl" />
  </div>
);

const ClientDashboard = () => (
  <Suspense fallback={<LoadingScreen />}>
    <DashboardContent />
  </Suspense>
);

export default ClientDashboard;