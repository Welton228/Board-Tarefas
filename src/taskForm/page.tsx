'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Esquema de validação com Zod
const taskSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório'),
  description: z.string().min(1, 'A descrição é obrigatória'),
});

// Tipagem do formulário
type TaskFormData = z.infer<typeof taskSchema>;

// Tipagem da task vinda como prop
interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  userId: string;
  createdAt?: Date;
}

// Tipagem das props do componente
interface TaskFormProps {
  task?: Task; // Se existir, é edição
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
  const isEditing = !!task;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  // Preenche os campos caso esteja editando
  useEffect(() => {
    if (isEditing && task) {
      setValue('title', task.title);
      setValue('description', task.description);
    }
  }, [isEditing, task, setValue]);

  const onSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);

    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/tasks/${task?.id}` : '/api/tasks';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Erro ao salvar tarefa');

      if (isEditing && onTaskUpdated) {
        onTaskUpdated();
      } else {
        onTaskSaved();
        reset(); // Limpa o formulário se for criação
      }
    } catch (error: any) {
      console.error(error.message);
      // Aqui pode ser adicionado toast futuramente
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
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
          {...register('title')}
          className="p-3 rounded-xl bg-gray-900 text-black border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 text-lg font-semibold"
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Campo da Descrição */}
      <div className="flex flex-col">
        <label htmlFor="description" className="text-sm text-gray-300 mb-1">
          Descrição
        </label>
        <textarea
          id="description"
          placeholder="Adicione mais detalhes sobre a tarefa..."
          {...register('description')}
          className="p-3 rounded-xl bg-gray-900 text-black border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 text-base max-h-40 overflow-y-auto"
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Botões */}
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
          disabled={isSubmitting}
          className={`px-4 py-2 rounded-lg ${
            isSubmitting ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-500'
          } text-white transition`}
        >
          {isSubmitting
            ? isEditing
              ? 'Salvando...'
              : 'Criando...'
            : isEditing
            ? 'Salvar alterações'
            : 'Criar tarefa'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
