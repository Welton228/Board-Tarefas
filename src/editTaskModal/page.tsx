'use client';

// React
import React, { useState } from 'react';

// Tipos
interface Task {
  id: string;
  title: string;
  description: string;
}

interface EditTaskModalProps {
  task: Task; // Tarefa a ser editada
  onClose: () => void; // Função para fechar o modal
  onTaskUpdated: () => void; // Função para recarregar a lista de tarefas
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, onClose, onTaskUpdated }) => {
  const [title, setTitle] = useState(task.title); // Estado para o título
  const [description, setDescription] = useState(task.description); // Estado para a descrição

  // Função para salvar as alterações
  const handleSave = async () => {
    const response = await fetch('/api/tasks', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: task.id, title, description }),
    });

    if (response.ok) {
      alert('Tarefa atualizada com sucesso!');
      onTaskUpdated(); // Recarrega a lista de tarefas
      onClose(); // Fecha o modal
    } else {
      alert('Erro ao atualizar tarefa.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Editar Tarefa</h2>
        <input
          type="text"
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="p-2 border rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          placeholder="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="p-2 border rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal;