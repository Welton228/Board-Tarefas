'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlusCircle, FiX } from 'react-icons/fi';

/**
 * Esquema de validação com Zod para os dados do formulário
 */
const taskSchema = z.object({
  title: z.string()
    .min(1, 'O título é obrigatório')
    .max(100, 'O título deve ter no máximo 100 caracteres'),
  description: z.string()
    .min(1, 'A descrição é obrigatória')
    .max(500, 'A descrição deve ter no máximo 500 caracteres'),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskFormProps {
  onTaskCreated: (taskData: TaskFormData) => Promise<void> | void;
  onClose?: () => void; // Opcional para fechar o modal
}

/**
 * Componente de formulário para criação de tarefas com design premium
 */
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
    mode: 'onChange', // Validação em tempo real
    defaultValues: {
      title: '',
      description: '',
    },
  });

  /**
   * Envia os dados do formulário para a API
   */
  const onSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);
    setShowSuccess(false);

    try {
      await onTaskCreated(data);
      
      // Feedback visual de sucesso
      setShowSuccess(true);
      reset();
      
      // Reset do feedback após 3 segundos
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
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
        className="relative bg-gray-800/50 backdrop-blur-lg border border-gray-700/30 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6"
      >
        {/* Botão de fechar (se estiver em um modal) */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            aria-label="Fechar formulário"
          >
            <FiX size={24} />
          </button>
        )}

        {/* Cabeçalho */}
        <div className="text-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full mb-4"
          >
            <FiPlusCircle className="text-white text-2xl" />
          </motion.div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Nova Tarefa
          </h2>
          <p className="text-gray-400 mt-1">Preencha os detalhes da sua tarefa</p>
        </div>

        {/* Campo Título */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-gray-300 text-sm font-medium">
            Título *
          </label>
          <input
            type="text"
            id="title"
            {...register('title')}
            placeholder="Ex: Reunião com equipe"
            className="w-full p-4 rounded-xl bg-gray-700/50 text-white placeholder-gray-400 border border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
            maxLength={100}
          />
          {errors.title && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm mt-1"
            >
              {errors.title.message}
            </motion.p>
          )}
        </div>

        {/* Campo Descrição */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-gray-300 text-sm font-medium">
            Descrição *
          </label>
          <textarea
            id="description"
            {...register('description')}
            placeholder="Ex: Discutir os próximos passos do projeto"
            className="w-full p-4 h-32 resize-none rounded-xl bg-gray-700/50 text-white placeholder-gray-400 border border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
            maxLength={500}
          />
          {errors.description && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm mt-1"
            >
              {errors.description.message}
            </motion.p>
          )}
        </div>

        {/* Feedback de sucesso */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-green-600/20 text-green-400 p-3 rounded-lg border border-green-400/30 text-center"
            >
              Tarefa criada com sucesso!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão de envio */}
        <motion.button
          type="submit"
          disabled={isSubmitting || !isValid}
          whileHover={{ scale: isValid ? 1.02 : 1 }}
          whileTap={{ scale: isValid ? 0.98 : 1 }}
          className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
            isSubmitting
              ? 'bg-gray-600 cursor-not-allowed'
              : isValid
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-blue-500/20'
                : 'bg-gray-700 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="block w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
              Criando...
            </span>
          ) : (
            'Criar Tarefa'
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default CreateTaskForm;