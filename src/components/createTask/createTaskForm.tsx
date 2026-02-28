"use client";

import React from "react";
// ✅ Verifique se o caminho do TaskForm está exatamente assim no seu projeto
import TaskForm from "../../components/taskForm/taskForm"; 

/**
 * 📝 INTERFACE DE PROPS
 * Seguindo o Clean Code: nomes claros para funções de retorno.
 */
interface CreateTaskFormProps {
  onTaskCreated: () => void; // Disparado após o sucesso no banco de dados
  onClose: () => void;       // Disparado ao cancelar ou fechar o modal
}

/**
 * ✅ COMPONENTE: CreateTaskForm
 * Este componente isola a lógica de criação. 
 * Mantivemos o design original, pois ele delega a interface para o TaskForm.
 */
const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ 
  onTaskCreated, 
  onClose 
}) => {
  
  // Renderização simples e direta. 
  // O TaskForm deve conter toda a lógica de fetch e validação Zod.
  return (
    <div className="w-full h-full">
      <TaskForm 
        onTaskSaved={onTaskCreated} 
        onClose={onClose} 
      />
    </div>
  );
};

export default CreateTaskForm;