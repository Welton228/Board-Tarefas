'use client';

import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Head from 'next/head';
import CreateTaskForm from "@/createTask/page";
import TaskForm from "../../taskForm/page"; // Componente genérico para criação/edição de tarefas

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  userId: string;
  createdAt?: Date;
}

const ClientDashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar tarefas do usuário logado
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tasks', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      // Verifica se a sessão expirou
      if (response.status === 401) {
        signOut({ callbackUrl: '/?message=Sessao expirada' });
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erro ao buscar tarefas');
      }

      const data = await response.json();
      setTasks(data);
    } catch (error: any) {
      setError(error.message || 'Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  };

  // Alternar o status de conclusão de uma tarefa
  const toggleTaskCompletion = async (id: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });

      if (response.status === 401) throw new Error('Sessão expirada');
      if (!response.ok) throw new Error('Falha ao atualizar tarefa');

      setTasks(prev =>
        prev.map(task =>
          task.id === id ? { ...task, completed: !completed } : task
        )
      );
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Excluir uma tarefa
  const deleteTask = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });

      if (response.status === 401) throw new Error('Sessão expirada');
      if (!response.ok) throw new Error('Falha ao excluir tarefa');

      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Carrega as tarefas ao detectar uma sessão ativa
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/?message=Faça login para acessar');
      return;
    }
    if (status === 'authenticated' && session) fetchTasks();
  }, [status, session]);

  // Carregamento da sessão
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 border-opacity-70"></div>
        <p className="text-lg text-gray-300">Carregando seu dashboard...</p>
      </div>
    );
  }

  // Se não houver sessão, retorna null
  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-6 text-gray-100 font-sans">
      <Head>
        <title>Dashboard</title>
        <meta name="description" content="Painel de controle de tarefas" />
      </Head>

      {/* Exibição de erro */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center z-50 animate-fade-in">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 font-bold hover:text-gray-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Header do dashboard */}
      <header className="bg-white/5 backdrop-blur-md shadow-xl rounded-2xl p-6 mb-8 border border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-4xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">Dashboard</h1>
            <p className="text-gray-300 mt-2 text-lg">
              {session.user?.name ? `Bem-vindo, ${session.user.name}!` : "Carregando..."}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl shadow-md hover:brightness-110 hover:scale-105 transition-all duration-300 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-400"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo principal: formulário + lista de tarefas */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Criar Nova Tarefa */}
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Criar Nova Tarefa</h2>
          <CreateTaskForm onTaskCreated={fetchTasks} />
        </div>

        {/* Tarefas Cadastradas */}
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Tarefas Cadastradas</h2>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500" />
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-gray-400 italic text-center py-8 sm:text-sm lg:text-base">Nenhuma tarefa encontrada</p>
          ) : (
            <ul className="space-y-4">
              {tasks.map(task => (
                <li
                  key={task.id}
                  className={`bg-gray-800/60 backdrop-blur-md p-4 rounded-xl shadow-sm transition-all duration-300 flex flex-col sm:flex-row sm:justify-between sm:items-center border ${task.completed ? 'border-green-500' : 'border-gray-600'}`}
                >
                  <div className="flex-1 mb-4 sm:mb-0 sm:mr-4">
                    {/* Título da tarefa */}
                    <h3 className={`text-lg font-semibold ${task.completed ? 'text-green-400 line-through' : 'text-white'}`}>
                      {task.title}
                    </h3>

                    {/* Descrição com rolagem vertical e quebra automática de linha */}
                    <p className="text-gray-300 mt-1 whitespace-pre-wrap break-words max-h-40 overflow-y-auto pr-2">
                      {task.description}
                    </p>
                  </div>

                  {/* Ações: editar, concluir, excluir */}
                  <div className="flex sm:flex-col sm:space-y-2 space-x-2 sm:space-x-0">
                    <button
                      onClick={() => setEditingTask(task)}
                      className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-transform hover:scale-110"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => toggleTaskCompletion(task.id, task.completed)}
                      className={`p-2 text-white rounded-lg transition-transform hover:scale-110 ${task.completed ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                      title={task.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
                    >
                      {task.completed ? '✅' : '⬜'}
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-transform hover:scale-110"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal de Edição de Tarefa */}
      {editingTask && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-50">
          <div className="bg-gray-800 p-6 rounded-2xl w-full sm:max-w-lg max-w-xl border border-gray-600 shadow-xl animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-4">Editar Tarefa</h2>
            <TaskForm
              task={editingTask}
              onClose={() => setEditingTask(null)}
              onTaskSaved={() => {
                fetchTasks();
                setEditingTask(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
