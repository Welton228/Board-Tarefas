'use client';
export const runtime = "nodejs";

import React, { useEffect, useState, useRef, useCallback, useMemo, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Head from "next/head";
import CreateTaskForm from "@/createTaskUi/page";
import TaskForm from "../../taskForm/page";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { FiLogOut, FiRefreshCw, FiEdit2, FiTrash2, FiCheck, FiPlus } from "react-icons/fi";

/**
 * Interface para representar uma tarefa (versão simplificada para performance)
 */
interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  userId: string;
  updatedAt?: string; // Adicionado para controle de cache
}

/**
 * Interface para notificações do sistema
 */
interface Notification {
  message: string;
  type: 'success' | 'error';
  id: string;
}

/**
 * Componente de item de tarefa memoizado para performance
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
        {/* Checkbox interativo */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onToggle(task.id, task.completed)}
          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
            task.completed 
              ? 'border-green-400 bg-green-400/10' 
              : 'border-gray-500 hover:border-blue-400'
          } transition-colors`}
          aria-label={`Marcar tarefa como ${task.completed ? 'não concluída' : 'concluída'}`}
        >
          {task.completed && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-green-400"
            >
              <FiCheck />
            </motion.span>
          )}
        </motion.button>

        {/* Conteúdo da tarefa */}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-lg font-medium truncate ${
              task.completed ? 'line-through text-gray-400' : 'text-white'
            }`}
            title={task.title}
          >
            {task.title}
          </h3>
          {task.description && (
            <p
              className={`text-sm mt-1 whitespace-pre-wrap break-words ${
                task.completed ? 'line-through text-gray-500' : 'text-gray-300'
              }`}
            >
              {task.description}
            </p>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEdit(task)}
            className="p-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-400 transition-colors"
            aria-label="Editar tarefa"
          >
            <FiEdit2 />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDelete(task.id)}
            className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-red-400 transition-colors"
            aria-label="Excluir tarefa"
          >
            <FiTrash2 />
          </motion.button>
        </div>
      </div>
    </div>
  </motion.div>
));

TaskItem.displayName = 'TaskItem';

/**
 * Componente principal do Dashboard (agora envolvido por Suspense)
 */
const DashboardContent = () => {
  // Dados de autenticação e roteamento
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams(); // Agora seguro dentro de Suspense
  
  // Estados otimizados
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isHoveringHeader, setIsHoveringHeader] = useState(false);

  // Referências para controle
  const modalRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);
  const controllerRef = useRef<AbortController>();
  const lastFetchRef = useRef<number>(0);

  // Separa tarefas concluídas e pendentes (otimização de renderização)
  const [pendingTasks, completedTasks] = useMemo(() => {
    const pending = [];
    const completed = [];
    for (const task of tasks) {
      if (task.completed) completed.push(task);
      else pending.push(task);
    }
    return [pending, completed];
  }, [tasks]);

  /**
   * Mostra notificação na tela (com auto-fechamento)
   */
  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { message, type, id }]);
    
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  /**
   * Busca tarefas com otimizações
   */
  const fetchTasks = useCallback(async () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    
    const now = Date.now();
    if (now - lastFetchRef.current < 2000) return;
    
    lastFetchRef.current = now;
    setLoading(true);
    
    try {
      controllerRef.current = new AbortController();
      
      const response = await fetch(`/api/tasks?ts=${now}`, {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        },
        signal: controllerRef.current.signal,
        next: { revalidate: 0 }
      });

      if (response.status === 401) {
        await signOut({ callbackUrl: "/login?error=SessionExpired" });
        return;
      }

      if (!response.ok) {
        throw new Error(await response.text() || "Erro ao buscar tarefas");
      }

      const data: Task[] = await response.json();
      if (isMounted.current) {
        setTasks(data);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError' && isMounted.current) {
        showNotification(error.message || "Erro ao carregar tarefas", 'error');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [showNotification]);

  /**
   * Cria uma nova tarefa (com atualização otimista)
   */
  const createTask = useCallback(async (taskData: { title: string; description: string }) => {
    const optimisticTask: Task = {
      id: `temp-${Date.now()}`,
      ...taskData,
      completed: false,
      userId: session?.user?.id || ''
    };

    setTasks(prev => [optimisticTask, ...prev]);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (response.status === 401) {
        await signOut({ callbackUrl: "/login?error=SessionExpired" });
        return;
      }

      if (!response.ok) {
        throw new Error("Falha ao criar tarefa");
      }

      const newTask = await response.json();
      
      setTasks(prev => prev.map(t => 
        t.id === optimisticTask.id ? newTask : t
      ));

      showNotification("Tarefa criada com sucesso!", 'success');
      return newTask;
    } catch (error: any) {
      setTasks(prev => prev.filter(t => t.id !== optimisticTask.id));
      showNotification(error.message || "Erro ao criar tarefa", 'error');
      throw error;
    }
  }, [showNotification, session?.user?.id]);

  /**
   * Alterna status de conclusão da tarefa (otimizado)
   */
  const toggleTaskCompletion = useCallback(async (id: string, completed: boolean) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !completed } : task
    ));

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });

      if (response.status === 401) {
        await signOut({ callbackUrl: "/login?error=SessionExpired" });
        return;
      }

      if (!response.ok) {
        throw new Error("Falha ao atualizar tarefa");
      }

      const updatedTask = await response.json();
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updatedTask } : task
      ));
    } catch (error: any) {
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, completed } : task
      ));
      showNotification(error.message || "Erro ao atualizar tarefa", 'error');
    }
  }, [showNotification]);

  /**
   * Exclui tarefa com confirmação e otimização
   */
  const deleteTask = useCallback(async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;

    const deletedTask = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(task => task.id !== id));

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        await signOut({ callbackUrl: "/login?error=SessionExpired" });
        return;
      }

      if (!response.ok) {
        throw new Error("Falha ao excluir tarefa");
      }

      showNotification("Tarefa excluída com sucesso!", 'success');
    } catch (error: any) {
      if (deletedTask) {
        setTasks(prev => [...prev, deletedTask].sort((a, b) => 
          new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
        ));
      }
      showNotification(error.message || "Erro ao excluir tarefa", 'error');
    }
  }, [tasks, showNotification]);

  // Efeitos para gerenciar eventos e sessão
  useEffect(() => {
    const controller = new AbortController();
    
    if (status === "authenticated") {
      fetchTasks();
    }

    return () => controller.abort();
  }, [status, fetchTasks]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
    }
  }, [status, router]);

  // Skeleton loading para melhor UX
  const renderTaskSkeletons = () => (
    [...Array(3)].map((_, i) => (
      <motion.div
        key={`skeleton-${i}`}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
        className="bg-gray-800/50 rounded-xl p-4 h-20 mb-3"
      />
    ))
  );

  // Renderização condicional
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-gradient-to-br from-gray-900 to-gray-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-t-transparent border-r-blue-500 border-b-purple-600 border-l-pink-500 rounded-full"
        ></motion.div>
        <motion.p 
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
          className="text-lg text-gray-300 font-light"
        >
          Preparando seu espaço...
        </motion.p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-gray-100 font-sans overflow-hidden">
      <Head>
        <title>Nexus Task | Dashboard</title>
        <meta name="description" content="Painel de controle de tarefas premium" />
      </Head>

      {/* Efeito de partículas de fundo */}
      <div className="fixed inset-0 overflow-hidden opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0
            }}
            animate={{ 
              y: [null, (Math.random() - 0.5) * 100],
              opacity: [0, 0.8, 0],
              transition: { 
                duration: 10 + Math.random() * 20,
                repeat: Infinity,
                repeatType: "reverse"
              }
            }}
            className="absolute w-1 h-1 bg-blue-400 rounded-full"
          />
        ))}
      </div>

      {/* Cabeçalho com efeito de vidro */}
      <motion.header
        onHoverStart={() => setIsHoveringHeader(true)}
        onHoverEnd={() => setIsHoveringHeader(false)}
        className="fixed top-0 left-0 right-0 bg-gray-800/30 backdrop-blur-lg shadow-2xl z-40 border-b border-gray-700/50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            animate={{
              backgroundPosition: isHoveringHeader ? '100% 50%' : '0% 50%'
            }}
            transition={{ duration: 2 }}
            className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent bg-[length:200%_100%]"
          >
            <h1 className="text-3xl font-bold">Nexus Task</h1>
            <p className="text-sm font-light">{session.user?.name || "Bem-vindo"}</p>
          </motion.div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-red-500/30 transition-all"
          >
            <FiLogOut />
            <span>Sair</span>
          </motion.button>
        </div>
      </motion.header>

      {/* Conteúdo principal */}
      <main className="pt-28 pb-10 px-6 max-w-7xl mx-auto relative z-10">
        {/* Seção de criação de tarefa */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 mb-8"
        >
          <div className="p-1 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30">
            <div className="bg-gray-800/80 p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <FiPlus className="text-blue-400" />
                <span>Criar Nova Tarefa</span>
              </h2>
              <CreateTaskForm 
                onTaskCreated={createTask}
              />
            </div>
          </div>
        </motion.section>

        {/* Lista de tarefas com skeleton loading */}
        <LayoutGroup>
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800/50 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50"
          >
            <div className="p-1 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30">
              <div className="bg-gray-800/80 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FiCheck className="text-purple-400" />
                    <span>Suas Tarefas</span>
                    {!loading && (
                      <span className="text-sm font-normal bg-gray-700/50 px-2 py-1 rounded-full ml-2">
                        {tasks.length}
                      </span>
                    )}
                  </h2>
                  <motion.button
                    onClick={fetchTasks}
                    disabled={loading}
                    whileHover={{ rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors disabled:opacity-50"
                    aria-label="Recarregar tarefas"
                  >
                    <FiRefreshCw className={`${loading ? 'animate-spin' : ''}`} />
                  </motion.button>
                </div>

                {loading && tasks.length === 0 ? (
                  <div className="space-y-3">
                    {renderTaskSkeletons()}
                  </div>
                ) : tasks.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <p className="text-gray-400 text-lg">Nenhuma tarefa encontrada</p>
                    <p className="text-gray-500 text-sm mt-2">Crie sua primeira tarefa acima</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Tarefas não concluídas primeiro */}
                    {pendingTasks.map((task) => (
                      <TaskItem 
                        key={task.id}
                        task={task}
                        onToggle={toggleTaskCompletion}
                        onEdit={setEditingTask}
                        onDelete={deleteTask}
                      />
                    ))}

                    {/* Separador visual */}
                    {pendingTasks.length > 0 && completedTasks.length > 0 && (
                      <div className="border-t border-gray-700/50 my-3"></div>
                    )}

                    {/* Tarefas concluídas */}
                    {completedTasks.map((task) => (
                      <TaskItem 
                        key={task.id}
                        task={task}
                        onToggle={toggleTaskCompletion}
                        onEdit={setEditingTask}
                        onDelete={deleteTask}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        </LayoutGroup>
      </main>

      {/* Modal de edição */}
      <AnimatePresence>
        {editingTask && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              ref={modalRef}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700/50 w-full max-w-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="p-1 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 rounded-t-3xl">
                <div className="bg-gray-800/90 p-8 rounded-t-3xl">
                  <h3 className="text-2xl font-bold text-black mb-6 flex items-center gap-2">
                    <FiEdit2 className="text-purple-400" />
                    <span>Editar Tarefa</span>
                  </h3>
                  <TaskForm
                    task={editingTask}
                    onTaskSaved={() => {
                      setEditingTask(null);
                      fetchTasks();
                      showNotification("Tarefa atualizada com sucesso!", 'success');
                    }}
                  />
                </div>
              </div>
              <div className="p-4 bg-gray-800/50 border-t border-gray-700/50 rounded-b-3xl flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setEditingTask(null)}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
                >
                  Cancelar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notificações */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className={`${
                notification.type === 'success' 
                  ? 'bg-green-600/90 border-green-400/30' 
                  : 'bg-red-600/90 border-red-400/30'
              } backdrop-blur-md text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 border`}
              role={notification.type === 'success' ? 'status' : 'alert'}
            >
              <div className="flex-1">{notification.message}</div>
              <button
                onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notification.id))}
                className="text-white/70 hover:text-white transition-colors"
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Efeito de iluminação */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl"></div>
      </div>
    </div>
  );
};

/**
 * Componente wrapper principal que adiciona o boundary Suspense
 */
const ClientDashboard = () => {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-gradient-to-br from-gray-900 to-gray-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-t-transparent border-r-blue-500 border-b-purple-600 border-l-pink-500 rounded-full"
        ></motion.div>
        <motion.p 
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
          className="text-lg text-gray-300 font-light"
        >
          Carregando dashboard...
        </motion.p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
};

export default ClientDashboard;