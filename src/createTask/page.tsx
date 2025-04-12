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
    <form onSubmit={handleSubmit} className="space-y-6 bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-gray-700">
      <div>
        <label htmlFor="title" className="block text-white font-semibold text-lg mb-2">
          Título
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Digite o título da tarefa"
          className="w-full p-4 bg-gray-700 text-black rounded-lg shadow-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-70 transition-all duration-300"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-white font-semibold text-lg mb-2">
          Descrição
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Digite a descrição da tarefa"
          className="w-full p-4 bg-gray-700 text-black rounded-lg shadow-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-70 transition-all duration-300"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg shadow-md hover:brightness-110 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500"
      >
        Criar Tarefa
      </button>
    </form>
  );
};

export default CreateTaskForm;
