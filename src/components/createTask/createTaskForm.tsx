'use client';

import React from 'react';
import TaskForm from '@/components/taskForm/taskForm'; // Ajuste o caminho se necessário

/**
 * Props do CreateTaskForm
 */
interface CreateTaskFormProps {
  onTaskCreated: () => void; // Função chamada após criação bem-sucedida
  onClose: () => void;       // Função para fechar o modal
}

/**
 * Componente para criação de tarefa usando o TaskForm
 * Recebe callbacks para manipulação externa do estado/modal
 */
const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ onTaskCreated, onClose }) => {
  return (
    <TaskForm onTaskSaved={onTaskCreated} onClose={onClose} />
  );
};

export default CreateTaskForm;
