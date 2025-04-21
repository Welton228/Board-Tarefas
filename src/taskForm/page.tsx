import React, { useState, useEffect } from 'react';

interface TaskFormProps {
  task?: {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    userId: string;
    createdAt?: Date;
  };
  onClose?: () => void;
  onTaskSaved: () => void;
  onTaskUpdated?: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({
  task,
  onClose,
  onTaskSaved,
  onTaskUpdated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const isEditing = !!task;

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/tasks/${task?.id}` : '/api/tasks';
    const body = JSON.stringify({ title, description });

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (response.ok) {
      isEditing && onTaskUpdated ? onTaskUpdated() : onTaskSaved();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto space-y-4 bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-lg"
    >
      {/* Campo do Título */}
      <div className="flex flex-col">
        <label htmlFor="title" className="text-sm text-gray-300 mb-1">
          Título da Tarefa
        </label>
        <input
          id="title"
          type="text"
          placeholder="Ex: Estudar Next.js 15"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="p-3 rounded-xl bg-gray-900 text-black border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 text-lg font-semibold"
          required
        />
      </div>

      {/* Campo da Descrição */}
      <div className="flex flex-col">
        <label htmlFor="description" className="text-sm text-gray-300 mb-1">
          Descrição
        </label>
        <textarea
          id="description"
          placeholder="Adicione mais detalhes sobre a tarefa..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="p-3 rounded-xl bg-gray-900 text-black border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 text-base max-h-40 overflow-y-auto"
          required
        />
      </div>

      {/* Ações */}
      <div className="flex justify-end space-x-2 pt-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
        >
          {isEditing ? 'Salvar alterações' : 'Criar tarefa'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
