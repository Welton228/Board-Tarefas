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
    setIsSubmitting(true);
    setError(null);

    try {
      // Verificação completa da sessão
      if (status !== 'authenticated' || !session?.user?.id) {
        throw new Error('Por favor, faça login novamente');
      }

      const accessToken = (session as any)?.accessToken;
      if (!accessToken) {
        throw new Error('Token de acesso não encontrado');
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ 
          title: title.trim(),
          description: description.trim()
        }),
      });

      // Verificação detalhada da resposta
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

      // Limpa o formulário após sucesso
      setTitle('');
      setDescription('');
      onTaskCreated();

    } catch (error: any) {
      console.error('Erro detalhado:', error);
      setError(error.message || 'Erro ao criar tarefa');
      
      // Tratamento específico para erros de autenticação
      if (error.message.includes('não autorizado') || 
          error.message.includes('login')) {
        setError('Sessão expirada. Por favor, faça login novamente.');
      }
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