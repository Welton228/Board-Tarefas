// TaskForm.tsx
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
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onClose, onTaskSaved }) => {
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
      onTaskSaved();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Título"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 rounded bg-gray-800 text-white"
        required
      />
      <textarea
        placeholder="Descrição"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 rounded bg-gray-800 text-white"
        required
      />
      <div className="flex justify-end space-x-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {isEditing ? 'Salvar alterações' : 'Criar tarefa'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
