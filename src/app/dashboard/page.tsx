'use client';
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Head from 'next/head';
import CreateTaskForm from "@/createTask/page";
import EditTaskModal from "../../editTaskModal/page";

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  userId: string;
}

const Dashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Verificação robusta da sessão e token
      if (!session?.user?.id || !(session as any).accessToken) {
        throw new Error('Sessão não autenticada');
      }

      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${(session as any).accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar tarefas');
      }

      const data = await response.json();
      setTasks(data);
    } catch (error: any) {
      console.error('Erro detalhado:', error);
      setError(error.message || 'Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompletion = async (id: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session as any).accessToken}`
        },
        body: JSON.stringify({ completed: !completed }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar tarefa');
      }

      fetchTasks();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(session as any).accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir tarefa');
      }

      fetchTasks();
    } catch (error: any) {
      setError(error.message);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTasks();
    }
  }, [status]);

  if (status === "loading") {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Carregando...</div>;
  }

  if (!session) {
    router.push("/?message=Acesso negado! Faça login primeiro.");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 p-6">
      <Head>
        <title>Dashboard</title>
      </Head>

      {error && (
        <div className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg flex items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 font-bold">×</button>
        </div>
      )}

      <header className="bg-gray-700 shadow-xl rounded-2xl p-6 mb-8 border border-gray-600">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-300 mt-2">Bem-vindo, {session.user?.name}!</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-700 shadow-xl rounded-2xl p-6 mb-8 border border-gray-600">
          <h2 className="text-2xl font-semibold text-white mb-4">Criar Nova Tarefa</h2>
          <CreateTaskForm onTaskCreated={fetchTasks} />
        </div>

        <div className="bg-gray-700 shadow-xl rounded-2xl p-6 mb-8 border border-gray-600">
          <h2 className="text-2xl font-semibold text-white mb-4">Tarefas Cadastradas</h2>
          
          {loading ? (
            <div className="text-center text-gray-400">Carregando tarefas...</div>
          ) : tasks.length === 0 ? (
            <p className="text-gray-400 italic">Nenhuma tarefa encontrada</p>
          ) : (
            <ul className="space-y-4">
              {tasks.map((task) => (
                <li 
                  key={task.id}
                  className={`bg-gray-600 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 flex justify-between items-center border ${
                    task.completed ? 'border-green-500' : 'border-gray-500'
                  }`}
                >
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${
                      task.completed ? 'text-green-300 line-through' : 'text-white'
                    }`}>
                      {task.title}
                    </h3>
                    <p className="text-gray-300">{task.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingTask(task)}
                      className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
                      title="Editar tarefa"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => toggleTaskCompletion(task.id, task.completed)}
                      className={`p-2 rounded-lg ${
                        task.completed
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-yellow-600 hover:bg-yellow-700'
                      } text-white`}
                      title={task.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
                    >
                      {task.completed ? '✅' : '⬜'}
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
                      title="Excluir tarefa"
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

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onTaskUpdated={fetchTasks}
        />
      )}
    </div>
  );
};

export default Dashboard;