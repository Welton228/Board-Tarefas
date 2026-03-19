'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { FiLoader, FiSend, FiSave } from "react-icons/fi";
import toast from 'react-hot-toast'; // ✅ Importação adicionada

/**
 * 📝 SCHEMA DE VALIDAÇÃO
 */
const taskSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  description: z.string().min(5, 'A descrição deve ter pelo menos 5 caracteres'),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: any;
  onClose?: () => void;
  onTaskSaved?: () => void;
  onTaskUpdated?: () => void;
}

const TaskForm = ({ task, onClose, onTaskSaved, onTaskUpdated }: TaskFormProps) => {
  const isEditing = Boolean(task);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const { 
    register, 
    handleSubmit, 
    setValue, 
    reset, 
    formState: { errors, isValid } 
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '', description: '' },
    mode: 'onChange',
  });

  // Efeito para carregar dados caso seja edição
  useEffect(() => {
    if (isEditing && task) {
      setValue('title', task.title);
      setValue('description', task.description);
    }
  }, [isEditing, task, setValue]);

  const onSubmit = async (data: TaskFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const method = isEditing ? 'PATCH' : 'POST';
    const url = isEditing ? `/api/tasks?id=${task?.id}` : '/api/tasks';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        toast.error("Sessão expirada");
        router.push('/login');
        return;
      }

      if (!response.ok) throw new Error();

      toast.success(isEditing ? "Nexus atualizado!" : "Tarefa lançada!");

      if (isEditing) {
        onTaskUpdated?.();
      } else {
        reset();
        onTaskSaved?.();
      }
      
      if (onClose) setTimeout(onClose, 800);

    } catch (error) {
      toast.error("Erro no processamento dos dados");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
      {/* INPUT TÍTULO */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 ml-1">
          Título
        </label>
        <input 
          {...register('title')} // ✅ Corrigido: Removido o {...register('register')} que causava erro
          placeholder="Nome da operação..."
          disabled={isSubmitting} 
          className="w-full p-4 rounded-2xl bg-white/3 text-white border border-white/5 focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-700 font-medium" 
        />
        {errors.title && (
          <span className="text-red-400 text-[10px] font-bold ml-1">{errors.title.message}</span>
        )}
      </div>

      {/* TEXTAREA DESCRIÇÃO */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 ml-1">
          Detalhes Técnicos
        </label>
        <textarea 
          {...register('description')} 
          rows={4} 
          placeholder="Descreva o fluxo..."
          disabled={isSubmitting} 
          className="w-full p-4 rounded-2xl bg-white/3 text-white border border-white/5 focus:border-blue-500/50 outline-none resize-none transition-all placeholder:text-gray-700 font-light" 
        />
        {errors.description && (
          <span className="text-red-400 text-[10px] font-bold ml-1">{errors.description.message}</span>
        )}
      </div>

      <div className="flex justify-end items-center gap-4 pt-4">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Descartar alterações"
            aria-label="Cancelar edição do registro"
            className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          title={isEditing ? "Salvar alterações" : "Criar nova tarefa"}
          aria-label={isEditing ? "Atualizar registro no sistema" : "Lançar nova tarefa no sistema"}
          className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:grayscale text-white font-black text-[11px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] cursor-pointer active:scale-95"
        >
          {isSubmitting ? (
            <FiLoader className="animate-spin w-4 h-4" />
          ) : (
            <>
              {isEditing ? <FiSave size={16} /> : <FiSend size={16} />}
              <span>{isEditing ? 'Atualizar Nexus' : 'Lançar'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;