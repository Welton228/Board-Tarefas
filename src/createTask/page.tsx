'use client';

// React
import React, { useState } from 'react';

// Define as props do componente
interface CreateTaskFormProps {
  onTaskCreated?: () => void; // Função opcional para ser chamada após criar uma tarefa
}

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ onTaskCreated = () => {} }) => {
  // Estados para armazenar o título e a descrição da tarefa
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Função chamada quando o formulário é enviado
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede o recarregamento da página

    // Envia uma requisição POST para a API de tarefas
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, description }), // Envia os dados da tarefa
    });

    // Verifica se a requisição foi bem-sucedida
    if (response.ok) {
      alert('Tarefa criada com sucesso!'); // Exibe um alerta de sucesso
      setTitle(''); // Limpa o campo do título
      setDescription(''); // Limpa o campo da descrição
      onTaskCreated(); // Chama a função para recarregar as tarefas (se existir)
    } else {
      alert('Erro ao criar tarefa.'); // Exibe um alerta de erro
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Campo de entrada para o título */}
      <input
        type="text"
        placeholder="Título"
        value={title}
        onChange={(e) => setTitle(e.target.value)} // Atualiza o estado do título
        className="p-2 border rounded w-full"
      />
      {/* Campo de entrada para a descrição */}
      <textarea
        placeholder="Descrição"
        value={description}
        onChange={(e) => setDescription(e.target.value)} // Atualiza o estado da descrição
        className="p-2 border rounded w-full"
      />
      {/* Botão para enviar o formulário */}
      <button
        type="submit"
        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Criar Tarefa
      </button>
    </form>
  );
};

export default CreateTaskForm;