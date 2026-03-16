'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

/**
 * 🎯 ESQUEMA DE VALIDAÇÃO
 * Define as regras para título e descrição usando Zod.
 */
const taskSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório').max(100, 'Máximo 100 caracteres'),
  description: z.string().min(1, 'A descrição é obrigatória').max(500, 'Máximo 500 caracteres'),
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

  // Preenche o formulário caso esteja em modo de edição
  useEffect(() => {
    if (isEditing && task) {
      setValue('title', task.title);
      setValue('description', task.description);
    }
  }, [isEditing, task, setValue]);

  /**
   * 🛠️ LÓGICA DE ENVIO
   * Gerencia tanto a criação (POST) quanto a atualização (PUT).
   */
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

      // Caso o token JWT tenha expirado ou falhado
      if (response.status === 401) {
        router.push('/login?message=Sessão expirada.');
        return;
      }

      if (!response.ok) throw new Error('Erro ao processar requisição');

      // Feedback para o componente pai
      if (isEditing && onTaskUpdated) {
        onTaskUpdated();
      } else {
        onTaskSaved();
        reset();
      }

      if (onClose) onClose();

    } catch (error: any) {
      console.error("[TASK_FORM_ERROR]:", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className="space-y-5 bg-gray-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl"
    >
      {/* Campo de Título */}
      <div className="flex flex-col space-y-1.5">
        <label htmlFor="title" className="text-xs font-bold text-blue-400 uppercase tracking-wider ml-1">
          Título da Tarefa
        </label>
        <input 
          id="title"
          {...register('title')} 
          placeholder="Ex: Estudar Next.js 15"
          className="p-3.5 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" 
        />
        {errors.title && (
          <span className="text-red-400 text-xs mt-1 ml-1 font-medium">{errors.title.message}</span>
        )}
      </div>

      {/* Campo de Descrição */}
      <div className="flex flex-col space-y-1.5">
        <label htmlFor="description" className="text-xs font-bold text-blue-400 uppercase tracking-wider ml-1">
          Descrição Detalhada
        </label>
        <textarea 
          id="description"
          {...register('description')} 
          placeholder="O que precisa ser feito?"
          /* ✅ Atualizado: min-h-25 (100px) seguindo Tailwind v4 */
          className="p-3.5 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none min-h-25" 
        />
        {errors.description && (
          <span className="text-red-400 text-xs mt-1 ml-1 font-medium">{errors.description.message}</span>
        )}
      </div>

      {/* Ações do Formulário */}
      <div className="flex justify-end gap-3 pt-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
          >
            Cancelar
          </button>
        )}
        <button 
          type="submit" 
          disabled={isSubmitting} 
          /* ✅ bg-linear-to-r aplicado no botão para combinar com o tema */
          className="px-8 py-2.5 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
        >
          {isSubmitting ? 'Gravando...' : isEditing ? 'Atualizar Tarefa' : 'Criar Tarefa'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;