'use client';

import React, { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Head from "next/head";
import CreateTaskForm from "@/createTask/page";
import TaskForm from "../../taskForm/page";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Interface que representa a estrutura de uma tarefa
 */
interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  userId: string;
  createdAt?: Date;
}

/**
 * Componente principal do Dashboard
 */
const ClientDashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estados locais
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Referências
  const modalRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);
  const errorTimeoutRef = useRef<NodeJS.Timeout>();
  const successTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Busca as tarefas do usuário
   */
  const fetchTasks = async () => {
    if (!isMounted.current) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tasks", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      // Tratamento de sessão expirada
      if (response.status === 401) {
        await handleSessionExpired();
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Erro ao buscar tarefas");
      }

      const data: Task[] = await response.json();
      if (isMounted.current) setTasks(data);
    } catch (error: any) {
      if (isMounted.current) {
        setError(error?.message || "Erro ao carregar tarefas");
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  /**
   * Alterna o status de conclusão da tarefa
   */
  const toggleTaskCompletion = async (id: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
        cache: "no-store",
      });

      if (response.status === 401) {
        await handleSessionExpired();
        return;
      }

      if (!response.ok) throw new Error("Falha ao atualizar tarefa");

      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, completed: !completed } : task
        )
      );
    } catch (error: any) {
      setError(error.message || "Erro ao atualizar tarefa");
    }
  };

  /**
   * Exclui uma tarefa
   */
  const deleteTask = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        cache: "no-store",
      });

      if (response.status === 401) {
        await handleSessionExpired();
        return;
      }

      if (!response.ok) throw new Error("Falha ao excluir tarefa");

      setTasks((prev) => prev.filter((task) => task.id !== id));
      showSuccessMessage("Tarefa excluída com sucesso!");
    } catch (error: any) {
      setError(error.message || "Erro ao excluir tarefa");
    }
  };

  /**
   * Manipula sessão expirada
   */
  const handleSessionExpired = async () => {
    await signOut({ callbackUrl: "/login?error=SessionExpired" });
  };

  /**
   * Exibe mensagem de sucesso temporária
   */
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    successTimeoutRef.current = setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  /**
   * Fecha o modal ao clicar fora ou pressionar ESC
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditingTask(null);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setEditingTask(null);
      }
    };

    if (editingTask) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingTask]);

  /**
   * Verifica sessão e carrega tarefas
   */
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
      return;
    }

    if (status === "authenticated" && session) {
      fetchTasks();
      
      // Exibe mensagem de boas-vindas se vier de login
      const fromLogin = searchParams.get("fromLogin");
      if (fromLogin) {
        showSuccessMessage(`Bem-vindo(a) de volta, ${session.user?.name || ""}!`);
      }
    }
  }, [status, session, router, searchParams]);

  /**
   * Limpa timeouts e evita memory leaks
   */
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  /**
   * Auto-fecha mensagens de erro após 5 segundos
   */
  useEffect(() => {
    if (error) {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(() => {
        setError(null);
      }, 5000);
    }
  }, [error]);

  // Tela de carregamento
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 border-opacity-70"></div>
        <p className="text-lg text-gray-300">Carregando seu dashboard...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-6 text-gray-100 font-sans">
      <Head>
        <title>Dashboard de Tarefas</title>
        <meta name="description" content="Painel de controle de tarefas" />
      </Head>

      {/* Notificações */}
      <div className="fixed top-4 right-4 space-y-3 z-50">
        {/* Mensagem de erro */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center"
              role="alert"
              aria-live="assertive"
            >
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-4 font-bold hover:text-gray-300 focus:outline-none"
                aria-label="Fechar mensagem de erro"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mensagem de sucesso */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center"
              role="status"
              aria-live="polite"
            >
              <span>{successMessage}</span>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-4 font-bold hover:text-gray-300 focus:outline-none"
                aria-label="Fechar mensagem de sucesso"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cabeçalho */}
      <header className="bg-white/5 backdrop-blur-md shadow-xl rounded-2xl p-6 mb-8 border border-gray-700">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-300 mt-2 text-lg">
              {session.user?.name || "Bem-vindo(a)"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">
              {tasks.length} {tasks.length === 1 ? "tarefa" : "tarefas"}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl shadow-md hover:brightness-110 hover:scale-105 transition-all duration-300 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-400"
              aria-label="Sair da conta"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Criar tarefa */}
        <section 
          className="bg-white/5 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-gray-700"
          aria-labelledby="create-task-heading"
        >
          <h2 id="create-task-heading" className="text-2xl font-bold text-white mb-4">
            Criar Nova Tarefa
          </h2>
          <CreateTaskForm 
            onTaskCreated={() => {
              fetchTasks();
              showSuccessMessage("Tarefa criada com sucesso!");
            }} 
          />
        </section>

        {/* Listar tarefas */}
        <section 
          className="bg-white/5 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-gray-700"
          aria-labelledby="tasks-list-heading"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 id="tasks-list-heading" className="text-2xl font-bold text-white">
              Suas Tarefas
            </h2>
            <button
              onClick={fetchTasks}
              disabled={loading}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              aria-label="Recarregar tarefas"
            >
              Atualizar
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-blue-500 border-opacity-70"></div>
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Nenhuma tarefa cadastrada.</p>
          ) : (
            <ul className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
              {tasks.map((task) => (
                <motion.li
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="bg-gray-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskCompletion(task.id, task.completed)}
                      aria-label={`Marcar tarefa "${task.title}" como ${
                        task.completed ? "não concluída" : "concluída"
                      }`}
                      className="flex-shrink-0 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="min-w-0">
                      <h3
                        className={`text-lg font-semibold truncate ${
                          task.completed ? "line-through text-gray-500" : "text-white"
                        }`}
                        title={task.title}
                      >
                        {task.title}
                      </h3>
                      <p
                        className={`mt-1 text-sm whitespace-pre-wrap break-words ${
                          task.completed ? "line-through text-gray-400" : "text-gray-300"
                        }`}
                      >
                        {task.description}
                      </p>
                    </div>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-3 mt-3 md:mt-0">
                    <button
                      onClick={() => setEditingTask(task)}
                      aria-label={`Editar tarefa ${task.title}`}
                      className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg px-3 py-1 text-white font-semibold transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      aria-label={`Excluir tarefa ${task.title}`}
                      className="bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg px-3 py-1 text-white font-semibold transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Modal de edição */}
      <AnimatePresence>
        {editingTask && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-task-title"
          >
            <motion.div
              ref={modalRef}
              className="bg-gray-900 rounded-3xl p-8 max-w-xl w-full shadow-lg border border-gray-700"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
            >
              <h3 id="edit-task-title" className="text-2xl font-bold text-white mb-6">
                Editar Tarefa
              </h3>
              <TaskForm
                task={editingTask}
                onTaskSaved={() => {
                  setEditingTask(null);
                  fetchTasks();
                  showSuccessMessage("Tarefa atualizada com sucesso!");
                }}
              />
              <button
                onClick={() => setEditingTask(null)}
                aria-label="Fechar modal de edição"
                className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-2 font-semibold focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-500"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientDashboard;