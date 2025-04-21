// components/CreateTaskForm.tsx
import React, { useState } from "react";

interface CreateTaskFormProps {
  onTaskCreated: () => void;
}

const CreateTaskForm = ({ onTaskCreated }: CreateTaskFormProps) => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, completed: false }),
      });

      if (!response.ok) throw new Error("Falha ao criar tarefa");

      onTaskCreated(); // Atualiza a lista de tarefas
      setTitle("");
      setDescription("");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto bg-white/5 border border-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-xl space-y-6 animate-fade-in"
    >
      <h2 className="text-white text-2xl font-bold mb-4 text-center">Nova Tarefa</h2>

      {/* Campo de Título */}
      <div className="space-y-2">
        <label htmlFor="title" className="block text-white text-sm font-medium">
          Título
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Digite o título da tarefa"
          className="w-full p-4 rounded-xl bg-white/20 text-white placeholder-white/60 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Campo de Descrição */}
      <div className="space-y-2">
        <label htmlFor="description" className="block text-white text-sm font-medium">
          Descrição
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Digite a descrição da tarefa"
          className="w-full p-4 h-32 resize-none rounded-xl bg-white/20 text-white placeholder-white/60 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Botão de Envio */}
      <button
        type="submit"
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-md hover:scale-105 hover:brightness-110 transition-all duration-300"
      >
        Criar Tarefa
      </button>
    </form>
  );
};

export default CreateTaskForm;
