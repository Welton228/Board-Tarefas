'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * 📝 Esquema de validação centralizado (Clean Code)
 */
const taskSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  description: z.string().min(5, 'A descrição deve ter pelo menos 5 caracteres'),
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
  onTaskSaved?: () => void;
  onTaskUpdated?: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({
  task,
  onClose,
  onTaskSaved,
  onTaskUpdated,
}) => {
  const isEditing = Boolean(task);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '', description: '' },
    mode: 'onChange',
  });

  useEffect(() => {
    if (isEditing && task) {
      setValue('title', task.title);
      setValue('description', task.description);
    }
  }, [isEditing, task, setValue]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

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

      // ✅ TRATAMENTO DE AUTH: Se der 401, a sessão expirou
      if (response.status === 401) {
        showToast('Sessão expirada. Redirecionando...', 'error');
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      if (!response.ok) throw new Error('Falha na comunicação com o servidor');

      showToast(isEditing ? 'Tarefa atualizada!' : 'Tarefa criada com sucesso!');
      
      if (isEditing) {
        onTaskUpdated?.();
      } else {
        reset();
        onTaskSaved?.();
      }
      
      // Fecha o modal após um breve delay para o usuário ver o sucesso
      if (onClose) setTimeout(onClose, 1500);

    } catch (error: any) {
      showToast(error.message || 'Erro inesperado', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-2xl mx-auto space-y-5 bg-gray-900/50 p-6 rounded-2xl border border-blue-500/10 shadow-2xl backdrop-blur-sm"
      >
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-blue-300/80 ml-1">Título</label>
          <input
            {...register('title')}
            placeholder="O que precisa ser feito?"
            disabled={isSubmitting}
            className="p-3 rounded-xl bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
          {errors.title && <span className="text-red-400 text-xs ml-1">{errors.title.message}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-blue-300/80 ml-1">Descrição</label>
          <textarea
            {...register('description')}
            placeholder="Detalhes da tarefa..."
            rows={4}
            disabled={isSubmitting}
            className="p-3 rounded-xl bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
          />
          {errors.description && <span className="text-red-400 text-xs ml-1">{errors.description.message}</span>}
        </div>

        <div className="flex justify-end items-center gap-3 pt-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors"
            >
              Descartar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-all shadow-lg shadow-blue-600/20"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              isEditing ? 'Salvar' : 'Criar Agora'
            )}
          </button>
        </div>
      </form>

      {/* Toast Feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`fixed bottom-6 right-6 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl z-[100] border ${
              toast.type === 'success' 
                ? 'bg-emerald-600 border-emerald-400/30' 
                : 'bg-red-600 border-red-400/30'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TaskForm;