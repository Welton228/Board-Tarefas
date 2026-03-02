'use client';

/**
 * 🛠️ CONFIGURAÇÕES DE RUNTIME (Next.js 15)
 * Forçamos nodejs para garantir compatibilidade com as APIs de Auth.
 */
export const runtime = "nodejs";

import React, { useEffect, useState, useRef, useCallback, useMemo, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { FiLogOut, FiRefreshCw, FiEdit2, FiTrash2, FiCheck, FiPlus } from "react-icons/fi";

// Importações de componentes de UI
import CreateTaskForm from "../../createTaskUi/page";
import TaskForm from "../../taskForm/page";

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
 * 🚀 DASHBOARD CONTENT
 * Design preservado, lógica de sessão blindada contra logout involuntário.
 */
const DashboardContent = () => {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const isMounted = useRef(true);
  const controllerRef = useRef<AbortController>();

  // Notificações limpas
  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { message, type, id }]);
    setTimeout(() => {
      if (isMounted.current) setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  /**
   * 📡 BUSCA DE TAREFAS (Com proteção 401)
   */
  const fetchTasks = useCallback(async () => {
    // 🛡️ Prevenção: Não busca se não estiver explicitamente autenticado
    if (status !== "authenticated") return;
    
    if (controllerRef.current) controllerRef.current.abort();
    setLoading(true);
    
    try {
      controllerRef.current = new AbortController();
      const response = await fetch("/api/tasks", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controllerRef.current.signal,
      });

      // Se o token expirou (401), tentamos o silent refresh antes de deslogar
      if (response.status === 401) {
        const newSession = await update();
        if (!newSession && isMounted.current) router.push('/login');
        return; 
      }

      if (!response.ok) throw new Error();

      const data = await response.json();
      if (isMounted.current) setTasks(data);
    } catch (error: any) {
      if (error.name !== 'AbortError' && isMounted.current) {
        showNotification("Erro ao sincronizar dados", 'error');
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [status, update, router, showNotification]);

  // Ciclo de Vida: Monitora autenticação
  useEffect(() => {
    isMounted.current = true;
    if (status === "authenticated") {
      fetchTasks();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
    return () => { isMounted.current = false; };
  }, [status, fetchTasks, router]);

  // Memoização das listas (Performance)
  const [pendingTasks, completedTasks] = useMemo(() => [
    tasks.filter(t => !t.completed),
    tasks.filter(t => t.completed)
  ], [tasks]);

  // --- RENDERIZAÇÃO DE SEGURANÇA ---
  if (status === "loading") return <LoadingScreen />;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* HEADER: Design Preservado */}
      <header className="fixed top-0 left-0 right-0 bg-gray-800/30 backdrop-blur-lg z-40 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Nexus Task
            </h1>
            <p className="text-sm text-gray-400">{session.user?.name}</p>
          </div>
          <button 
            type="button"
            aria-label="Sair do sistema"
            onClick={() => signOut({ callbackUrl: "/login" })} 
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30 transition-all"
          >
            <FiLogOut /> <span>Sair</span>
          </button>
        </div>
      </header>

      <main className="pt-28 pb-10 px-6 max-w-7xl mx-auto relative z-10">
        <section className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700/50 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <FiPlus className="text-blue-400" /> Criar Tarefa
          </h2>
          <CreateTaskForm onTaskCreated={fetchTasks} />
        </section>

        <LayoutGroup>
          <section className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FiCheck className="text-purple-400" /> Minhas Tarefas 
              </h2>
              <button 
                type="button"
                aria-label="Recarregar tarefas"
                onClick={fetchTasks} 
                disabled={loading} 
                className="p-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode='popLayout'>
                {tasks.map(task => (
                  <motion.div 
                    layout
                    key={task.id}
                    className="bg-gray-800/90 p-4 rounded-xl flex items-center justify-between border border-gray-700"
                  >
                    <span className={task.completed ? "line-through text-gray-500" : ""}>{task.title}</span>
                    <div className="flex gap-2">
                      <button type="button" aria-label="Editar" className="p-2 text-blue-400"><FiEdit2 /></button>
                      <button type="button" aria-label="Remover" className="p-2 text-red-400"><FiTrash2 /></button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </LayoutGroup>
      </main>

      {/* Portal de Notificações */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div 
              key={n.id} 
              initial={{ x: 50, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: 50, opacity: 0 }} 
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

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-950">
    <div className="w-12 h-12 border-4 border-t-transparent border-blue-500 rounded-full animate-spin" />
    <p className="mt-4 text-gray-400">Autenticando sessão...</p>
  </div>
);

const ClientDashboard = () => (
  <Suspense fallback={<LoadingScreen />}>
    <DashboardContent />
  </Suspense>
);

export default ClientDashboard;