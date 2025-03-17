'use client';

// React
import React, { useEffect, useState } from "react";

// Components
import Textarea from "@/app/textarea/page";
import CreateTaskForm from "@/createTask/page";
import EditTaskModal from "../../editTaskModal/page"; // Importe o modal de edição

// Next libs
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Head from 'next/head';

// Tipos
interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  userId: string; // Adicionamos o userId ao tipo Task
}

const Dashboard = () => {
  const { data: session, status } = useSession(); // Dados e status da sessão
  const router = useRouter(); // Hook para navegação
  const [tasks, setTasks] = useState<Task[]>([]); // Estado para armazenar as tarefas
  const [editingTask, setEditingTask] = useState<Task | null>(null); // Estado para a tarefa sendo editada

  // Função para buscar tarefas do usuário logado
  const fetchTasks = async () => {
    if (!session?.user?.id) return; // Verifica se o usuário está logado

    try {
      const res = await fetch('/api/tasks'); // Faz uma requisição GET para a API de tarefas
      const data = await res.json(); // Converte a resposta para JSON
      setTasks(data); // Atualiza o estado com as tarefas recebidas
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
    }
  };

  // Busca as tarefas ao carregar o dashboard
  useEffect(() => {
    if (session?.user?.id) {
      fetchTasks();
    }
  }, [session]);

  // Função para marcar tarefa como concluída
  const toggleTaskCompletion = async (id: string, completed: boolean) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, completed: !completed }), // Inverte o status
      });

      if (response.ok) {
        fetchTasks(); // Recarrega a lista de tarefas
      } else {
        alert('Erro ao marcar tarefa como concluída.');
      }
    } catch (error) {
      console.error("Erro ao marcar tarefa como concluída:", error);
    }
  };

  // Função para excluir tarefa
  const deleteTask = async (id: string) => {
    const confirmDelete = confirm('Tem certeza que deseja excluir esta tarefa?');
    if (!confirmDelete) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        fetchTasks(); // Recarrega a lista de tarefas
      } else {
        alert('Erro ao excluir tarefa.');
      }
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
    }
  };

  // Se o estado estiver carregando, exibe um carregamento
  if (status === "loading") {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Carregando...</div>;
  }

  // Se o usuário não estiver autenticado, redireciona para a home
  if (!session) {
    router.push("/?message=Acesso negado! Faça login primeiro.");
    return null; // Retorna null enquanto o redirecionamento ocorre
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 p-6">
      <Head>
        <title>Dashboard</title>
      </Head>

      {/* Cabeçalho */}
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

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto">
        {/* Formulário para criar tarefas */}
        <div className="bg-gray-700 shadow-xl rounded-2xl p-6 mb-8 border border-gray-600">
          <h2 className="text-2xl font-semibold text-white mb-4">Criar Nova Tarefa</h2>
          <CreateTaskForm onTaskCreated={fetchTasks} />
        </div>

        {/* Lista de tarefas */}
        <div className="bg-gray-700 shadow-xl rounded-2xl p-6 mb-8 border border-gray-600">
          <h2 className="text-2xl font-semibold text-white mb-4">Tarefas Cadastradas</h2>
          <ul className="space-y-4">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="bg-gray-600 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 flex justify-between items-center border border-gray-500"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                  <p className="text-gray-300">{task.description}</p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setEditingTask(task)} // Abre o modal de edição
                    className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors duration-300"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleTaskCompletion(task.id, task.completed)}
                    className={`p-2 rounded-lg ${
                      task.completed
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-yellow-600 hover:bg-yellow-700'
                    } text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors duration-300`}
                  >
                    {task.completed ? 'Concluída' : 'Marcar como concluída'}
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-300"
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Modal de edição */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)} // Fecha o modal
          onTaskUpdated={fetchTasks} // Recarrega a lista de tarefas após editar
        />
      )}
    </div>
  );
};

export default Dashboard;