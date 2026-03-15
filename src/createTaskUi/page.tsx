'use client';

import React, { useState, memo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlusCircle, FiX, FiCheckCircle } from 'react-icons/fi';
import { Loader2 } from 'lucide-react';

/**
 * 🎯 ESQUEMA DE VALIDAÇÃO (Zod)
 * Separar o schema permite que ele seja reutilizado em validações no lado do servidor (API).
 */
const taskSchema = z.object({
  title: z.string()
    .min(3, 'O título deve ter pelo menos 3 caracteres')
    .max(100, 'O título deve ter no máximo 100 caracteres'),
  description: z.string()
    .min(5, 'A descrição deve ter pelo menos 5 caracteres')
    .max(500, 'A descrição deve ter no máximo 500 caracteres'),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskFormProps {
  /** Função disparada após a validação do formulário, deve lidar com a persistência (API). */
  onTaskCreated: (data: TaskFormData) => Promise<void>;
  /** Função opcional para fechar o modal ou container do formulário. */
  onClose?: () => void;
}

/**
 * 🚀 COMPONENTE: CreateTaskForm
 * * Clean Code aplicado:
 * 1. Memoização: Evita re-renders quando o componente pai atualiza.
 * 2. Tailwind v4: Uso de 'bg-linear-to-r'.
 * 3. Single Responsibility: O formulário apenas valida e envia dados.
 */
const CreateTaskForm: React.FC<CreateTaskFormProps> = memo(({ onTaskCreated, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    mode: 'onChange', // Melhora a UX validando em tempo real
    defaultValues: { title: '', description: '' },
  });

  /**
   * 🛠️ HANDLER: Processamento do envio
   */
  const handleFormSubmit = async (data: TaskFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      // Comunicação com a função injetada via props
      await onTaskCreated(data);

      // Fluxo de sucesso
      setShowSuccess(true);
      reset(); // Reseta os campos do React Hook Form

      // Timer para feedback visual antes de fechar/limpar
      setTimeout(() => {
        setShowSuccess(false);
        if (onClose) onClose();
      }, 2500);

    } catch (error) {
      console.error('[FORM_SUBMIT_ERROR]:', error);
      // Aqui pode-se implementar um toast de erro global
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-md mx-auto"
    >
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="relative bg-gray-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 space-y-6"
      >
        {/* BOTÃO FECHAR */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors p-1 cursor-pointer focus:outline-none"
            aria-label="Fechar formulário"
          >
            <FiX size={22} />
          </button>
        )}

        {/* CABEÇALHO */}
        <header className="text-center space-y-3">
          <div className="inline-flex items-center justify-center bg-blue-600/20 p-4 rounded-2xl shadow-inner">
            <FiPlusCircle className="text-blue-500 text-3xl" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Nova Tarefa</h2>
          <p className="text-gray-400 text-sm">Organize seu fluxo de trabalho</p>
        </header>

        {/* CAMPOS DE ENTRADA */}
        <div className="space-y-5">
          {/* Título */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-blue-400/80 uppercase tracking-widest ml-1">
              Título da Atividade
            </label>
            <input
              {...register('title')}
              placeholder="Ex: Revisar PR de Autenticação"
              disabled={isSubmitting}
              className="w-full px-5 py-4 rounded-2xl bg-gray-800/40 text-white border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-600"
            />
            <AnimatePresence>
              {errors.title && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs font-medium ml-1"
                >
                  {errors.title.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-blue-400/80 uppercase tracking-widest ml-1">
              Detalhes
            </label>
            <textarea
              {...register('description')}
              placeholder="Quais são os próximos passos?"
              disabled={isSubmitting}
              className="w-full px-5 py-4 h-36 resize-none rounded-2xl bg-gray-800/40 text-white border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-600"
            />
            <AnimatePresence>
              {errors.description && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs font-medium ml-1"
                >
                  {errors.description.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* MENSAGEM DE SUCESSO */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 py-3 rounded-2xl border border-emerald-500/20 text-sm font-semibold"
            >
              <FiCheckCircle /> Sincronizado com o Nexus
            </motion.div>
          )}
        </AnimatePresence>

        {/* BOTÃO DE SUBMISSÃO */}
        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className={`w-full py-5 rounded-2xl font-bold text-white transition-all shadow-2xl flex items-center justify-center gap-3 cursor-pointer ${
            isValid && !isSubmitting
              ? 'bg-linear-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/25 active:scale-[0.98]'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed grayscale'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sincronizando...</span>
            </>
          ) : (
            'Confirmar Registro'
          )}
        </button>
      </form>
    </motion.div>
  );
});

CreateTaskForm.displayName = 'CreateTaskForm';

export default CreateTaskForm;