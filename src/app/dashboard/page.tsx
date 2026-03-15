'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { FiLogOut, FiRefreshCw, FiEdit2, FiTrash2, FiCheck, FiPlus } from "react-icons/fi";
import toast from 'react-hot-toast';

// Componentes internos
import CreateTaskForm from "../../createTaskUi/page";

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  userId: string;
}

const DashboardContent = () => {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const isMounted = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);

  /**
   * 📡 SINCRONIZAÇÃO DE DADOS
   */
  const fetchTasks = useCallback(async () => {
    if (status !== "authenticated") return;
    
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    setLoading(true);
    
    try {
      const response = await fetch("/api/tasks", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Erro ao buscar dados");

      const data = await response.json();
      if (isMounted.current) setTasks(Array.isArray(data) ? data : []);

    } catch (error: any) {
      if (error.name !== 'AbortError' && isMounted.current) {
        toast.error("Erro ao sincronizar tarefas");
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    isMounted.current = true;
    if (status === "authenticated") fetchTasks();
    return () => { isMounted.current = false; };
  }, [status, fetchTasks]);

  if (status === "loading") return <LoadingScreen />;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      
      {/* 🔝 HEADER */}
      <header className="fixed top-0 inset-x-0 bg-gray-900/60 backdrop-blur-xl z-40 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black bg-linear-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent uppercase tracking-tighter">
              Nexus Task
            </h1>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-none">
              {session.user?.email}
            </p>
          </div>
          <button 
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })} 
            aria-label="Sair da aplicação"
            title="Sair da conta"
            className="flex items-center gap-2 px-4 py-2 bg-red-600/10 text-red-400 rounded-xl hover:bg-red-600/20 transition-all border border-red-500/20 cursor-pointer"
          >
            <FiLogOut /> 
            <span className="text-xs font-bold uppercase tracking-wider">Sair</span>
          </button>
        </div>
      </header>

      {/* 📋 MAIN */}
      <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        
        <section className="bg-gray-800/30 rounded-3xl p-6 border border-white/5 mb-10">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <FiPlus className="text-blue-500" /> Nova Tarefa
          </h2>
          <CreateTaskForm onTaskCreated={fetchTasks} />
        </section>

        <LayoutGroup>
          <section className="bg-gray-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <FiCheck className="text-emerald-400" /> Suas Atividades
              </h2>
              
              <button 
                type="button"
                onClick={fetchTasks} 
                disabled={loading} 
                aria-label="Recarregar lista de tarefas"
                title="Recarregar tarefas"
                className="p-3 bg-gray-800 text-blue-400 rounded-2xl hover:bg-gray-700 transition-all cursor-pointer disabled:opacity-30"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode='popLayout'>
                {tasks.length > 0 ? (
                  tasks.map(task => (
                    <motion.div 
                      layout
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group bg-gray-800/40 p-5 rounded-2xl flex items-center justify-between border border-transparent hover:border-white/10 transition-all"
                    >
                      <div className="space-y-1">
                        <span className={`font-semibold block ${task.completed ? "line-through text-gray-600" : "text-gray-200"}`}>
                          {task.title}
                        </span>
                        <span className="text-xs text-gray-500">{task.description}</span>
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          type="button"
                          aria-label={`Editar tarefa: ${task.title}`}
                          title="Editar tarefa"
                          className="p-2 text-gray-400 hover:text-blue-400 bg-gray-800 rounded-lg border border-white/5 cursor-pointer"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button 
                          type="button"
                          aria-label={`Excluir tarefa: ${task.title}`}
                          title="Excluir tarefa"
                          className="p-2 text-gray-400 hover:text-red-400 bg-gray-800 rounded-lg border border-white/5 cursor-pointer"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  !loading && <p className="text-center py-20 text-gray-600">Nada pendente por aqui.</p>
                )}
              </AnimatePresence>
            </div>
          </section>
        </LayoutGroup>
      </main>
    </div>
  );
};

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-950">
    <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    <p className="mt-4 text-gray-600 text-[10px] font-black uppercase tracking-widest">Nexus Sinc</p>
  </div>
);

export default function ClientDashboard() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <DashboardContent />
    </Suspense>
  );
}