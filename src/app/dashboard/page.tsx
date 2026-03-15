'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { FiLogOut, FiRefreshCw, FiEdit2, FiTrash2, FiCheck, FiPlus } from "react-icons/fi";

// Componentes internos
import CreateTaskForm from "../../createTaskUi/page";

// --- INTERFACES ---
interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  userId: string;
}

interface Notification {
  message: string;
  type: 'success' | 'error';
  id: string;
}

/**
 * 🚀 CONTEÚDO PRINCIPAL DO DASHBOARD
 */
const DashboardContent = () => {
  // ✅ Na v5, o status 'authenticated' garante que o Middleware já validou a rota.
  const { data: session, status, update } = useSession();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const isMounted = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);

  /**
   * 📢 SISTEMA DE NOTIFICAÇÕES
   */
  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { message, type, id }]);
    setTimeout(() => {
      if (isMounted.current) setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  /**
   * 📡 BUSCA DE TAREFAS
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

      if (response.status === 401) {
        const sessionUpdate = await update();
        if (!sessionUpdate) return;
      }

      if (!response.ok) throw new Error("Falha ao buscar dados");

      const data = await response.json();
      if (isMounted.current) setTasks(Array.isArray(data) ? data : []);

    } catch (error: any) {
      if (error.name !== 'AbortError' && isMounted.current) {
        showNotification("Erro ao sincronizar tarefas", 'error');
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [status, update, showNotification]);

  /**
   * ⚙️ EFEITOS DE INICIALIZAÇÃO
   */
  useEffect(() => {
    isMounted.current = true;
    if (status === "authenticated") {
      fetchTasks();
    }
    return () => { 
      isMounted.current = false;
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [status, fetchTasks]);

  if (status === "loading") return <LoadingScreen />;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      
      {/* 🔝 CABEÇALHO */}
      <header className="fixed top-0 left-0 right-0 bg-gray-800/30 backdrop-blur-lg z-40 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            {/* ✅ CORREÇÃO: bg-linear-to-r conforme nova sintaxe do Tailwind */}
            <h1 className="text-3xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Nexus Task
            </h1>
            <p className="text-sm text-gray-400">{session.user?.email}</p>
          </div>
          <button 
            type="button" 
            aria-label="Sair da conta" 
            title="Sair da conta" 
            onClick={() => signOut({ callbackUrl: "/login" })} 
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30 transition-all cursor-pointer"
          >
            <FiLogOut aria-hidden="true" /> 
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* 📋 CONTEÚDO PRINCIPAL */}
      <main className="pt-28 pb-10 px-6 max-w-7xl mx-auto relative z-10">
        
        {/* SEÇÃO: CRIAR TAREFA */}
        <section className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700/50 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <FiPlus className="text-blue-400" aria-hidden="true" /> Criar Tarefa
          </h2>
          <CreateTaskForm onTaskCreated={fetchTasks} />
        </section>

        {/* SEÇÃO: LISTA DE TAREFAS */}
        <LayoutGroup>
          <section className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FiCheck className="text-purple-400" aria-hidden="true" /> Minhas Tarefas 
              </h2>
              <button 
                type="button" 
                aria-label="Recarregar lista de tarefas"
                title="Recarregar tarefas"
                onClick={fetchTasks} 
                disabled={loading} 
                className="p-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode='popLayout'>
                {tasks.length > 0 ? (
                  tasks.map(task => (
                    <motion.div 
                      layout
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-gray-800/90 p-4 rounded-xl flex items-center justify-between border border-gray-700 hover:border-gray-500 transition-all"
                    >
                      <span className={task.completed ? "line-through text-gray-500" : ""}>
                        {task.title}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          aria-label={`Editar tarefa: ${task.title}`}
                          title="Editar tarefa"
                          className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg cursor-pointer"
                        >
                          <FiEdit2 aria-hidden="true" />
                        </button>
                        <button 
                          type="button" 
                          aria-label={`Excluir tarefa: ${task.title}`}
                          title="Excluir tarefa"
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg cursor-pointer"
                        >
                          <FiTrash2 aria-hidden="true" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-10">Nenhuma tarefa encontrada.</p>
                )}
              </AnimatePresence>
            </div>
          </section>
        </LayoutGroup>
      </main>

      {/* 🔔 NOTIFICAÇÕES FLUTUANTES */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div 
              key={n.id} 
              initial={{ x: 50, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: 50, opacity: 0 }} 
              role="alert"
              className={`${n.type === 'success' ? 'bg-green-600' : 'bg-red-600'} px-6 py-4 rounded-xl shadow-xl text-white`}
            >
              {n.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * 🌀 TELA DE CARREGAMENTO
 */
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-950">
    <div className="w-12 h-12 border-4 border-t-transparent border-blue-500 rounded-full animate-spin" />
    <p className="mt-4 text-gray-400 font-medium tracking-widest">Sincronizando Nexus...</p>
  </div>
);

/**
 * 📦 EXPORTAÇÃO PRINCIPAL
 */
const ClientDashboard = () => (
  <Suspense fallback={<LoadingScreen />}>
    <DashboardContent />
  </Suspense>
);

export default ClientDashboard;