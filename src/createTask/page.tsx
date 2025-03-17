'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

interface CreateTaskFormProps {
  onTaskCreated: () => void; // Função para recarregar a lista de tarefas
}

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ onTaskCreated }) => {
  const { data: session } = useSession(); // Obtém a sessão do usuário
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado para controlar o envio do formulário
  const [error, setError] = useState<string | null>(null); // Estado para armazenar mensagens de erro

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verifica se o usuário está logado
    if (!session?.user?.id) {
      setError('Você precisa estar logado para criar uma tarefa.');
      return;
    }

    setIsSubmitting(true); // Inicia o estado de envio
    setError(null); // Limpa erros anteriores

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });

      if (response.ok) {
        onTaskCreated(); // Recarrega a lista de tarefas
        setTitle(''); // Limpa o campo de título
        setDescription(''); // Limpa o campo de descrição
      } else {
        const errorData = await response.json();
        setError(`Erro ao criar tarefa: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      setError('Erro ao criar tarefa. Verifique o console para mais detalhes.');
    } finally {
      setIsSubmitting(false); // Finaliza o estado de envio
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
      <input
        type="text"
        placeholder="Título"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
        disabled={isSubmitting} // Desabilita o campo durante o envio
      />
      <textarea
        placeholder="Descrição"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
        disabled={isSubmitting} // Desabilita o campo durante o envio
      />
      {error && (
        <p className="text-red-500 text-sm">{error}</p> // Exibe mensagens de erro
      )}
      <button
        type="submit"
        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 disabled:opacity-50"
        disabled={isSubmitting} // Desabilita o botão durante o envio
      >
        {isSubmitting ? 'Criando...' : 'Criar Tarefa'}
      </button>
    </form>
  );
};

export default CreateTaskForm;