'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

const taskSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório').max(100),
  description: z.string().min(1, 'A descrição é obrigatória').max(500),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  userId: string;
}

interface TaskFormProps {
  task?: Task;
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
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '', description: '' },
  });

  useEffect(() => {
    if (isEditing && task) {
      setValue('title', task.title);
      setValue('description', task.description);
    }
  }, [isEditing, task, setValue]);

  const onSubmit = async (data: TaskFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/tasks/${task?.id}` : '/api/tasks';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // ✅ TRATAMENTO DE SESSÃO: 
      // Se a API retornar 401, forçamos o redirecionamento para o login
      if (response.status === 401) {
        router.push('/login?message=Sessão expirada. Faça login novamente.');
        return;
      }

      if (!response.ok) throw new Error('Erro ao salvar tarefa');

      if (isEditing && onTaskUpdated) {
        onTaskUpdated();
      } else {
        onTaskSaved();
        reset();
      }

      if (onClose) onClose();

    } catch (error: any) {
      console.error("Erro na requisição:", error.message);
      alert("Houve um erro ao salvar a tarefa. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-2xl mx-auto space-y-4 bg-gray-900/80 backdrop-blur-md p-6 rounded-2xl border border-gray-800 shadow-2xl"
    >
      <div className="flex flex-col">
        <label htmlFor="title" className="text-sm font-medium text-gray-400 mb-1 ml-1">
          Título da Tarefa
        </label>
        <input
          id="title"
          {...register('title')}
          disabled={isSubmitting}
          className="p-3 rounded-xl bg-gray-800 text-gray-100 border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold"
          placeholder="O que precisa ser feito?"
        />
        {errors.title && <span className="text-red-500 text-xs mt-1 ml-1">{errors.title.message}</span>}
      </div>

      <div className="flex flex-col">
        <label htmlFor="description" className="text-sm font-medium text-gray-400 mb-1 ml-1">
          Descrição detalhada
        </label>
        <textarea
          id="description"
          {...register('description')}
          disabled={isSubmitting}
          className="p-3 rounded-xl bg-gray-800 text-gray-100 border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[120px] resize-none"
          placeholder="Descreva os detalhes..."
        />
        {errors.description && <span className="text-red-500 text-xs mt-1 ml-1">{errors.description.message}</span>}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold transition-all shadow-lg shadow-blue-900/20"
        >
          {isSubmitting ? 'Processando...' : isEditing ? 'Atualizar' : 'Criar Tarefa'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;