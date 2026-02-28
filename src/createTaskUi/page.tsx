'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlusCircle, FiX } from 'react-icons/fi';
import { Loader2 } from 'lucide-react'; // Padronizando os ícones de loading

/**
 * ✅ ESQUEMA DE VALIDAÇÃO
 * Aumentei o mínimo para 3 caracteres para evitar entradas vazias acidentais.
 */
const taskSchema = z.object({
  title: z.string()
    .min(3, 'O título deve ter pelo menos 3 caracteres')
    .max(100, 'O título deve ter no máximo 100 caracteres'),
  description: z.string()
    .min(5, 'A descrição deve ser mais detalhada (mín. 5 caracteres)')
    .max(500, 'A descrição deve ter no máximo 500 caracteres'),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskFormProps {
  onTaskCreated: (taskData: TaskFormData) => Promise<void> | void;
  onClose?: () => void;
}

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ onTaskCreated, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    mode: 'onChange',
    defaultValues: { title: '', description: '' },
  });

  const onSubmit = async (data: TaskFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowSuccess(false);

    try {
      // ✅ A lógica de fetch/API acontece no componente pai
      await onTaskCreated(data);
      
      setShowSuccess(true);
      reset();
      
      // Se estiver em um modal, fecha após o sucesso
      if (onClose) {
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
        }, 2000);
      } else {
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('[CREATE_TASK_ERROR]:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-7 space-y-6"
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors p-1"
            aria-label="Fechar"
          >
            <FiX size={20} />
          </button>
        )}

        {/* Cabeçalho Premium */}
        <div className="text-center space-y-2">
          <motion.div
            whileHover={{ rotate: 90 }}
            className="inline-flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl mb-2 shadow-lg shadow-blue-500/20"
          >
            <FiPlusCircle className="text-white text-2xl" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Nova Tarefa
          </h2>
          <p className="text-gray-400 text-sm">Organize seu dia agora mesmo</p>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider ml-1">Título</label>
            <input
              {...register('title')}
              placeholder="Ex: Estudar Banco de Dados"
              disabled={isSubmitting}
              className="w-full p-4 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-600"
            />
            {errors.title && <p className="text-red-400 text-xs mt-1 ml-1">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider ml-1">Descrição</label>
            <textarea
              {...register('description')}
              placeholder="O que você precisa fazer?"
              disabled={isSubmitting}
              className="w-full p-4 h-32 resize-none rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-600"
            />
            {errors.description && <p className="text-red-400 text-xs mt-1 ml-1">{errors.description.message}</p>}
          </div>
        </div>

        {/* Sucesso e Botão */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl border border-emerald-500/20 text-center text-sm font-medium"
            >
              ✓ Tarefa adicionada à sua lista!
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={isSubmitting || !isValid}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-xl flex items-center justify-center gap-2 ${
            isValid && !isSubmitting
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98]'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Confirmar Criação'
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default CreateTaskForm;