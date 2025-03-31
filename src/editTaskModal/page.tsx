'use client';
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Propriedades do modal de edição
 * @interface EditTaskModalProps
 * @property {Task} task - Tarefa a ser editada
 * @property {() => void} onClose - Fecha o modal
 * @property {() => void} onTaskUpdated - Atualiza a lista após edição
 */
interface EditTaskModalProps {
  task: {
    id: string;
    title: string;
    description: string;
  };
  onClose: () => void;
  onTaskUpdated: () => void;
}

/**
 * Modal para edição de tarefas
 * @param {EditTaskModalProps} props 
 * @returns JSX.Element
 */
const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, onClose, onTaskUpdated }) => {
  const { data: session } = useSession();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Envia as alterações para a API
   * @async
   * @function handleSubmit
   * @param {React.FormEvent} e - Evento de submissão
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas
    if (!session?.accessToken) {
      setError('Você precisa estar logado para editar tarefas');
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError('Título e descrição são obrigatórios');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Requisição PATCH para atualizar a tarefa
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar tarefa');
      }

      // Fecha o modal e atualiza a lista
      onTaskUpdated();
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-700 rounded-2xl p-6 w-full max-w-md border border-gray-600">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Editar Tarefa</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        {/* Formulário de edição */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo de título */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Campo de descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Mensagem de erro */}
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;