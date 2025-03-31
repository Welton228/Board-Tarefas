'use client';
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

interface CreateTaskFormProps {
  onTaskCreated: () => void;
}

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ onTaskCreated }) => {
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Token:', (session as any)?.accessToken); 
    setIsSubmitting(true);
    setError(null);

    try {
      // Verificação robusta da sessão
      if (!session?.user?.id || !(session as any)?.accessToken) {
        throw new Error('Sessão inválida');
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session as any).accessToken}`
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar tarefa');
      }

      // Limpa o formulário e atualiza a lista
      setTitle('');
      setDescription('');
      onTaskCreated();
    } catch (error: any) {
      console.error('Erro ao criar tarefa:', error);
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
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Criando...' : 'Criar Tarefa'}
      </button>
    </form>
  );
};

export default CreateTaskForm;