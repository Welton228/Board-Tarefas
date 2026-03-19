"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
// ✅ Verifique se este caminho está correto conforme sua estrutura de pastas
import TaskForm from "../taskForm/taskForm"; 

/**
 * 📝 INTERFACE DE PROPS
 * onTaskCreated: Atualiza a lista no Dashboard após o POST.
 * onClose: Fecha o modal ou limpa o estado de exibição.
 */
interface CreateTaskFormProps {
  onTaskCreated: () => void; 
  onClose: () => void;      
}

/**
 * ✅ COMPONENTE: CreateTaskForm
 * Atua como o Wrapper (Container) de alto nível.
 * Adicionei animações de entrada para manter o padrão "Oscar" do Dashboard.
 */
const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ 
  onTaskCreated, 
  onClose 
}) => {
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative w-full h-full"
    >
      {/* Botão de Fechar com Acessibilidade (Discernible Text) */}
      <button
        onClick={onClose}
        title="Fechar Formulário"
        aria-label="Fechar formulário de nova tarefa"
        className="absolute -top-2 -right-2 p-2 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-all z-10 cursor-pointer"
      >
        <FiX size={18} />
      </button>

      {/* O TaskForm é quem deve ter o useForm, zodResolver 
          e o fetch("/api/savework") com o 'throw new Error' 
      */}
      <div className="overflow-hidden rounded-3xl">
        <TaskForm 
          onTaskSaved={onTaskCreated} 
          onClose={onClose} 
        />
      </div>
    </motion.div>
  );
};

export default CreateTaskForm;