'use client';

/**
 * 🛠️ NOTA TÉCNICA (Next.js 15): 
 * Forçamos a runtime nodejs e garantimos que o componente não tente ser 
 * pré-renderizado estaticamente sem uma sessão ativa, evitando erros de Build.
 */
export const runtime = "nodejs";

import React, { useEffect, useState, useRef, useCallback, useMemo, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { FiLogOut, FiRefreshCw, FiEdit2, FiTrash2, FiCheck, FiPlus } from "react-icons/fi";

// Importações de componentes de UI (Certifique-se que os caminhos estão corretos)
import CreateTaskForm from "../../createTaskUi/page";
import TaskForm from "../../taskForm/page";

// --- INTERFACES ---
interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  userId: string;
  updatedAt?: string;
}

interface Notification {
  message: string;
  type: 'success' | 'error';
  id: string;
}

// --- COMPONENTES AUXILIARES (Design Preservado) ---

/**
 * TaskItem: Componente memorizado para evitar re-renderizações desnecessárias.
 * Corrigido: Atributos de acessibilidade e tipos de botão.
 */
const TaskItem = React.memo(({ 
  task, 
  onToggle, 
  onEdit, 
  onDelete 
}: {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, x: -50 }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
    className={`rounded-xl overflow-hidden ${task.completed ? 'opacity-70' : ''}`}
  >
    <div className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 p-1 rounded-xl">
      <div className="bg-gray-800/90 p-4 flex flex-col md:flex-row md:items-center gap-4 rounded-xl">
        <motion.button
          type="button"
          aria-label={task.completed ? "Marcar como pendente" : "Concluir tarefa"}
          whileTap={{ scale: 0.9 }}
          onClick={() => onToggle(task.id, task.completed)}
          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
            task.completed ? 'border-green-400 bg-green-400/10' : 'border-gray-500 hover:border-blue-400'
          } transition-colors`}
        >
          {task.completed && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-400">
              <FiCheck />
            </motion.span>
          )}
        </motion.button>

        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-medium truncate ${task.completed ? 'line-through text-gray-400' : 'text-white'}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className={`text-sm mt-1 whitespace-pre-wrap break-words ${task.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>
              {task.description}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button 
            type="button"
            aria-label="Editar tarefa"
            onClick={() => onEdit(task)} 
            className="p-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-400 transition-colors"
          >
            <FiEdit2 />
          </button>
          <button 
            type="button"
            aria-label="Excluir tarefa"
            onClick={() => onDelete(task.id)} 
            className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-red-400 transition-colors"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
    </div>
  </motion.div>
));
TaskItem.displayName = 'TaskItem';

// --- CONTEÚDO PRINCIPAL ---

const DashboardContent = () => {
  // Hook de sessão atualizado para lidar com re-sincronização automática
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  // Estados da Aplicação
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isHoveringHeader, setIsHoveringHeader] = useState(false);

  // Refs de controle
  const isMounted = useRef(true);
  const controllerRef = useRef<AbortController>();

  // Notificações com Clean Code
  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { message, type, id }]);
    setTimeout(() => {
        if (isMounted.current) setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  /**
   * 📡 BUSCA DE TAREFAS (Com tratamento para o erro de logout)
   * Se a API retornar 401, tentamos 'update()' para renovar o JWT antes de desistir.
   */
  const fetchTasks = useCallback(async () => {
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

      if (response.status === 401) {
        // Tenta recuperar a sessão silenciosamente antes de deslogar
        const newSession = await update();
        if (!newSession) router.push('/login');
        return; 
      }

      if (!response.ok) throw new Error("Erro de conexão");

      const data = await response.json();
      if (isMounted.current) setTasks(data);
    } catch (error: any) {
      if (error.name !== 'AbortError' && isMounted.current) {
        showNotification("Sincronizando dados...", 'error');
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [status, update, router, showNotification]);

  // CRUD Actions
  const createTask = useCallback(async (taskData: { title: string; description: string }) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error();
      const newTask = await response.json();
      setTasks(prev => [newTask, ...prev]);
      showNotification("Tarefa criada!", 'success');
      return newTask;
    } catch {
      showNotification("Erro ao criar tarefa", 'error');
    }
  }, [showNotification]);

  const toggleTaskCompletion = useCallback(async (id: string, completed: boolean) => {
    const oldTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t));

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setTasks(oldTasks);
      showNotification("Falha na atualização", 'error');
    }
  }, [tasks, showNotification]);

  const deleteTask = useCallback(async (id: string) => {
    if (!confirm("Deseja excluir permanentemente?")) return;
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      setTasks(prev => prev.filter(t => t.id !== id));
      showNotification("Tarefa removida", 'success');
    } catch {
      showNotification("Erro ao remover", 'error');
    }
  }, [showNotification]);

  // Controle de ciclo de vida
  useEffect(() => {
    isMounted.current = true;
    if (status === "authenticated") fetchTasks();
    return () => { isMounted.current = false; };
  }, [status, fetchTasks]);

  // Memoização das listas para performance
  const [pendingTasks, completedTasks] = useMemo(() => [
    tasks.filter(t => !t.completed),
    tasks.filter(t => t.completed)
  ], [tasks]);

  // Renderização Condicional de Segurança
  if (status === "loading") return <LoadingScreen />;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-gray-100 font-sans overflow-hidden">
      <Head>
        <title>Nexus Task | Dashboard</title>
      </Head>

      {/* Background Animated Particles */}
      <div className="fixed inset-0 overflow-hidden opacity-20 pointer-events-none" aria-hidden="true">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse" 
               style={{ top: `${Math.random()*100}%`, left: `${Math.random()*100}%` }} />
        ))}
      </div>

      <motion.header
        onHoverStart={() => setIsHoveringHeader(true)}
        onHoverEnd={() => setIsHoveringHeader(false)}
        className="fixed top-0 left-0 right-0 bg-gray-800/30 backdrop-blur-lg shadow-2xl z-40 border-b border-gray-700/50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div animate={{ backgroundPosition: isHoveringHeader ? '100% 50%' : '0% 50%' }} className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent bg-[length:200%_100%]">
            <h1 className="text-3xl font-bold">Nexus Task</h1>
            <p className="text-sm font-light">{session.user?.name || "Usuário"}</p>
          </motion.div>
          <button 
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })} 
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl shadow-lg hover:opacity-90 transition-all"
          >
            <FiLogOut /> <span>Sair</span>
          </button>
        </div>
      </motion.header>

      <main className="pt-28 pb-10 px-6 max-w-7xl mx-auto relative z-10">
        <section className="bg-gray-800/50 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 mb-8 p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <FiPlus className="text-blue-400" /> Criar Nova Tarefa
            </h2>
            <CreateTaskForm onTaskCreated={createTask} />
        </section>

        <LayoutGroup>
          <section className="bg-gray-800/50 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FiCheck className="text-purple-400" /> Minhas Tarefas 
                <span className="text-sm bg-gray-700 px-2 py-1 rounded-full" aria-label="Total de tarefas">{tasks.length}</span>
              </h2>
              <button 
                type="button"
                aria-label="Atualizar lista"
                onClick={fetchTasks} 
                disabled={loading} 
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence mode='popLayout'>
                {pendingTasks.map(task => (
                  <TaskItem key={task.id} task={task} onToggle={toggleTaskCompletion} onEdit={setEditingTask} onDelete={deleteTask} />
                ))}
                {pendingTasks.length > 0 && completedTasks.length > 0 && <div className="border-t border-gray-700/50 my-3" />}
                {completedTasks.map(task => (
                  <TaskItem key={task.id} task={task} onToggle={toggleTaskCompletion} onEdit={setEditingTask} onDelete={deleteTask} />
                ))}
              </AnimatePresence>
              {tasks.length === 0 && !loading && (
                <p className="text-center text-gray-500 py-10">Nenhuma tarefa encontrada.</p>
              )}
            </div>
          </section>
        </LayoutGroup>
      </main>

      <AnimatePresence>
        {editingTask && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-3xl p-8 w-full max-w-xl border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-6">Editar Tarefa</h3>
              <TaskForm task={editingTask} onTaskSaved={() => { setEditingTask(null); fetchTasks(); }} />
              <button 
                type="button"
                onClick={() => setEditingTask(null)} 
                className="mt-4 w-full py-2 bg-gray-700 text-white rounded-xl"
              >
                Cancelar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notifications Portal */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div key={n.id} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }} 
                        className={`${n.type === 'success' ? 'bg-green-600' : 'bg-red-600'} px-6 py-4 rounded-xl shadow-xl text-white`}>
              {n.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- COMPONENTES DE SUPORTE ---

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen gap-4 bg-gray-950">
    <div className="w-16 h-16 border-4 border-t-transparent border-blue-500 rounded-full animate-spin" />
    <p className="text-gray-300">Sincronizando Nexus Dashboard...</p>
  </div>
);

const ClientDashboard = () => (
  <Suspense fallback={<LoadingScreen />}>
    <DashboardContent />
  </Suspense>
);

export default ClientDashboard;