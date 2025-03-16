"use client";
import { useState, useEffect } from "react";

interface Tarefa {
  id: number;
  texto: string;
  publico: boolean;
}

export default function FormTarefa() {
  const [tarefa, setTarefa] = useState("");
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);

  useEffect(() => {
    // Carregar tarefas ao montar o componente
    fetch("/api/getworks")
      .then((res) => res.json())
      .then((data) => setTarefas(data.tarefas))
      .catch((error) => console.error("Erro ao carregar tarefas", error));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch("/api/savework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: tarefa }),
      });
      const data = await response.json();
      alert(data.message);
      setTarefa("");
      setTarefas([...tarefas, { id: data.id, texto: tarefa, publico: false }]);
    } catch (error) {
      console.error("Erro ao enviar a tarefa", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/deletetask/${id}`, { method: "DELETE" });
      setTarefas(tarefas.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Erro ao excluir a tarefa", error);
    }
  };

  const handleEdit = async (id: number, newText: string) => {
    try {
      await fetch(`/api/edittask/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: newText }),
      });
      setTarefas(tarefas.map((t) => (t.id === id ? { ...t, texto: newText } : t)));
    } catch (error) {
      console.error("Erro ao editar a tarefa", error);
    }
  };

  const handleTogglePublic = async (id: number, publico: boolean) => {
    try {
      await fetch(`/api/togglepublic/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publico: !publico }),
      });
      setTarefas(
        tarefas.map((t) => (t.id === id ? { ...t, publico: !publico } : t))
      );
    } catch (error) {
      console.error("Erro ao mudar status da tarefa", error);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 p-6">
      <section className="bg-white/20 backdrop-blur-lg border border-white/30 p-8 rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col items-center">
        <h1 className="text-3xl font-bold text-white drop-shadow-md">📌 Adicione sua tarefa</h1>
        <form onSubmit={handleSubmit} className="flex flex-col w-full mt-6 gap-5">
          <textarea
            className="w-full h-20 border border-white/30 bg-white/10 text-white rounded-xl p-4 resize-none focus:outline-none focus:ring-4 focus:ring-blue-300 placeholder:text-gray-200"
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
        <div className="w-full mt-6">
          {tarefas.map((tarefa) => (
            <div key={tarefa.id} className="bg-white/10 p-4 rounded-xl text-white mt-4 flex flex-col">
              <textarea
                className="w-full border-none bg-transparent text-white p-2 resize-none focus:outline-none"
                value={tarefa.texto}
                onChange={(e) => handleEdit(tarefa.id, e.target.value)}
              />
              <div className="flex justify-end gap-3 mt-2">
                <button onClick={() => handleDelete(tarefa.id)} className="text-red-400">❌ Excluir</button>
                <button onClick={() => handleTogglePublic(tarefa.id, tarefa.publico)} className={tarefa.publico ? "text-green-400" : "text-gray-400"}>
                  {tarefa.publico ? "🌍 Público" : "🔒 Privado"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}