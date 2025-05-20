'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Esquema de validação com Zod
const taskSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório'),
  description: z.string().min(1, 'A descrição é obrigatória'),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskFormProps {
  onTaskCreated: () => void;
}

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ onTaskCreated }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Erro ao criar tarefa');

      onTaskCreated(); // Atualiza lista no pai
      reset(); // Limpa o formulário
    } catch (error: any) {
      console.error(error.message);
      // Você pode substituir isso por um toast futuramente
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-full mx-auto bg-white/5 border border-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-xl space-y-6 animate-fade-in"
    >
      <h2 className="text-white text-2xl font-bold mb-4 text-center">Nova Tarefa</h2>

      {/* Campo Título */}
      <div className="space-y-2">
        <label htmlFor="title" className="block text-white text-sm font-medium">
          Título
        </label>
        <input
          type="text"
          id="title"
          {...register('title')}
          placeholder="Digite o título da tarefa"
          className="w-full p-4 rounded-xl bg-white/20 text-white placeholder-white/60 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Campo Descrição */}
      <div className="space-y-2">
        <label htmlFor="description" className="block text-white text-sm font-medium">
          Descrição
        </label>
        <textarea
          id="description"
          {...register('description')}
          placeholder="Digite a descrição da tarefa"
          className="w-full p-4 h-32 resize-none rounded-xl bg-white/20 text-white placeholder-white/60 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Botão de envio */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-3 ${
          isSubmitting ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-purple-600'
        } text-white font-semibold rounded-xl shadow-md hover:scale-105 hover:brightness-110 transition-all duration-300`}
      >
        {isSubmitting ? 'Criando...' : 'Criar Tarefa'}
      </button>
    </form>
  );
};

export default CreateTaskForm;
