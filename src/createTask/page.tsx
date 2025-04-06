'use client';
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

interface CreateTaskFormProps {
  onTaskCreated: () => void;
}

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ onTaskCreated }) => {
  const { data: session, status } = useSession();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Evita enviar requisição sem estar autenticado
    if (status !== 'authenticated') {
      setError('Sessão expirada. Faça login novamente.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // ⚠️ Authorization é opcional se backend usa getToken() com cookie
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Erro ao criar tarefa';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = await response.text() || errorMessage;
        }

        throw new Error(errorMessage);
      }

      // Limpa o formulário e chama callback para recarregar a lista
      setTitle('');
      setDescription('');
      onTaskCreated();

    } catch (error: any) {
      console.error('Erro detalhado:', error);
      setError(error.message || 'Erro ao criar tarefa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <textarea
          placeholder="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
          required
          disabled={isSubmitting}
        />
      </div>
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
      <button
        type="submit"
        className="w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        disabled={isSubmitting || status !== 'authenticated'}
      >
        {isSubmitting ? 'Criando...' : 'Criar Tarefa'}
      </button>
    </form>
  );
};

export default CreateTaskForm;
