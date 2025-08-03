'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Esquema de validação com Zod para os campos do formulário
 */
const taskSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório'),
  description: z.string().min(1, 'A descrição é obrigatória'),
});

/**
 * Tipo inferido do formulário baseado no schema
 */
type TaskFormData = z.infer<typeof taskSchema>;

/**
 * Interface da Task para edição
 */
interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  userId: string;
  createdAt?: Date;
}

/**
 * Props do componente TaskForm
 */
interface TaskFormProps {
  task?: Task; // se fornecido, formulário funciona em modo edição
  onClose?: () => void; // opcional para fechar modal
  onTaskSaved?: () => void; // callback ao salvar uma nova tarefa
  onTaskUpdated?: () => void; // callback ao atualizar uma tarefa existente
}

/**
 * Componente TaskForm com criação e edição, validação e feedback animado
 */
const TaskForm: React.FC<TaskFormProps> = ({
  task,
  onClose,
  onTaskSaved,
  onTaskUpdated,
}) => {
  const isEditing = Boolean(task);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
    },
    mode: 'onChange', // validação em tempo real
  });

  // Preenche os campos se estiver editando uma tarefa existente
  useEffect(() => {
    if (isEditing && task) {
      setValue('title', task.title);
      setValue('description', task.description);
    }
  }, [isEditing, task, setValue]);

  // Mostra um toast temporário com mensagem
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Função chamada ao enviar formulário
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

      if (isEditing) {
        onTaskUpdated?.();
        showToast('Tarefa atualizada com sucesso!');
      } else {
        onTaskSaved?.();
        reset();
        showToast('Tarefa criada com sucesso!');
      }
    } catch (error: any) {
      showToast(error.message || 'Erro ao salvar tarefa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Formulário */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-2xl mx-auto space-y-4 bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-lg"
      >
        {/* Campo Título */}
        <div className="flex flex-col">
          <label htmlFor="title" className="text-sm text-gray-300 mb-1">
            Título da Tarefa
          </label>
          <input
            id="title"
            type="text"
            placeholder="Ex: Estudar Next.js 15"
            {...register('title')}
            className="p-3 rounded-xl bg-gray-900 text-white border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 text-lg font-semibold"
            disabled={isSubmitting}
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Campo Descrição */}
        <div className="flex flex-col">
          <label htmlFor="description" className="text-sm text-gray-300 mb-1">
            Descrição
          </label>
          <textarea
            id="description"
            placeholder="Adicione mais detalhes sobre a tarefa..."
            {...register('description')}
            className="p-3 rounded-xl bg-gray-900 text-white border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 text-base max-h-40 overflow-y-auto"
            disabled={isSubmitting}
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
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className={`px-4 py-2 rounded-lg ${
              isSubmitting
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500'
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

      {/* Toast animado para mensagens */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-6 right-6 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TaskForm;
