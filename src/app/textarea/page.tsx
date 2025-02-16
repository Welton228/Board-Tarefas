"use client";
import { useState } from "react";

export default function FormTarefa() {
  const [tarefa, setTarefa] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Evita o recarregamento da página

    try {
      const response = await fetch("/api/savework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tarefa }),
      });

      const data = await response.json();
      alert(data.message);
      setTarefa(""); // Limpa o textarea após o envio
    } catch (error) {
      console.error("Erro ao enviar a tarefa", error);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 p-6">
    <section className="bg-white/20 backdrop-blur-lg border border-white/30 p-8 rounded-2xl shadow-2xl max-w-lg w-full flex flex-col items-center">
      <h1 className="text-3xl font-bold text-white drop-shadow-md">📌 Adicione sua tarefa</h1>
      
      <form onSubmit={handleSubmit} className="flex flex-col w-full mt-6 gap-5">
        <textarea
          className="w-full h-36 border border-white/30 bg-white/10 text-white rounded-xl p-4 resize-none focus:outline-none focus:ring-4 focus:ring-blue-300 placeholder:text-gray-200"
          placeholder="Escreva algo incrível..."
          value={tarefa}
          onChange={(e) => setTarefa(e.target.value)}
        />
  
        <button
          type="submit"
          className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
        >
          🚀 Salvar Tarefa
        </button>
      </form>
    </section>
  </main>
  

  );
}
