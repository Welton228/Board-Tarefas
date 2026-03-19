'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { 
  FiLogOut, FiRefreshCw, FiEdit3, FiTrash2, 
  FiCheckCircle, FiPlus, FiLayers, FiActivity 
} from "react-icons/fi";
import toast from 'react-hot-toast';

import TaskForm from "../../components/taskForm/taskForm";
import { Modal } from "../../components/modal/modal";

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  userId?: string;
}

const DashboardContent = () => {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const isMounted = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchTasks = useCallback(async () => {
    if (status !== "authenticated") return;
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    setLoading(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controllerRef.current.signal,
        cache: 'no-store', 
      });

      if (!response.ok) throw new Error();
      const result = await response.json();
      if (isMounted.current) setTasks(result.data || result);
    } catch (error: any) {
      if (error.name !== 'AbortError' && isMounted.current) {
        toast.error("Erro na conexão com o Nexus");
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [status]);

  const handleDelete = async (id: string) => {
    if (!confirm("Confirmar exclusão definitiva?")) return;
    try {
      const response = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      toast.success("Registro removido");
      fetchTasks();
    } catch {
      toast.error("Falha ao deletar");
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const response = await fetch(`/api/tasks?id=${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!response.ok) throw new Error();
      fetchTasks();
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  useEffect(() => {
    isMounted.current = true;
    if (status === "authenticated") fetchTasks();
    return () => { isMounted.current = false; };
  }, [status, fetchTasks]);

  if (status === "loading") return <LoadingScreen />;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-gray-900 via-black to-black text-gray-100">
      
      <header className="fixed top-0 inset-x-0 bg-black/40 backdrop-blur-2xl z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_25px_rgba(37,99,235,0.3)]">
              <FiLayers className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-[0.2em] bg-linear-to-r from-white to-gray-500 bg-clip-text text-transparent leading-none">
                Nexus <span className="text-blue-500 font-light italic">Task</span>
              </h1>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">{session.user?.email}</p>
            </div>
          </motion.div>
          
          <button 
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })} 
            title="Encerrar sessão"
            aria-label="Sair do sistema Nexus"
            className="group flex items-center gap-3 px-5 py-2.5 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-full border border-white/10 hover:border-red-500/20 transition-all cursor-pointer"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest">Sair</span>
            <FiLogOut className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </header>

      <main className="pt-32 pb-20 px-8 max-w-5xl mx-auto">
        <section className="relative mb-16">
          <div className="relative bg-white/2 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">Novo Registro</h2>
            </div>
            <TaskForm onTaskSaved={fetchTasks} />
          </div>
        </section>

        <LayoutGroup>
          <div className="flex justify-between items-end mb-10 px-4">
            <h2 className="text-3xl font-light tracking-tight text-white flex items-center gap-4">
              Inbox <FiActivity className="text-blue-500/30" size={24} />
            </h2>
            
            <button 
              type="button"
              onClick={fetchTasks} 
              disabled={loading} 
              title="Sincronizar dados"
              aria-label="Recarregar lista de tarefas"
              className="p-4 bg-white/5 text-blue-400 rounded-2xl hover:bg-white/10 border border-white/5 active:scale-95 disabled:opacity-20 cursor-pointer transition-all"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="grid gap-4">
            <AnimatePresence mode='popLayout'>
              {tasks.length > 0 ? (
                tasks.map((task, index) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    index={index} 
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => handleDelete(task.id)}
                    onToggle={() => handleToggleComplete(task)}
                  />
                ))
              ) : (
                !loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                    <p className="text-gray-600 font-light italic tracking-wide">Nexus está vazio. Nenhuma pendência.</p>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      </main>

      <Modal 
        isOpen={Boolean(editingTask)} 
        onClose={() => setEditingTask(null)} 
        title="Editar Registro Nexus"
      >
        {editingTask && (
          <TaskForm 
            task={editingTask} 
            onClose={() => setEditingTask(null)}
            onTaskUpdated={() => {
              fetchTasks();
              setEditingTask(null);
            }} 
          />
        )}
      </Modal>
    </div>
  );
};

const TaskCard = ({ task, index, onEdit, onDelete, onToggle }: any) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0, transition: { delay: index * 0.03 } }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="group relative bg-white/3 p-6 rounded-[2.5rem] flex items-center justify-between border border-white/5 hover:border-blue-500/30 hover:bg-white/5 transition-all duration-300"
  >
    <div className="flex items-center gap-6">
      <button
        type="button"
        onClick={onToggle}
        title={task.completed ? "Marcar como pendente" : "Concluir tarefa"}
        aria-label={task.completed ? "Reabrir tarefa" : "Finalizar tarefa"}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all cursor-pointer ${
          task.completed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-gray-800/40 border-white/5 group-hover:border-blue-500/20'
        }`}
      >
        <FiCheckCircle className={task.completed ? 'text-emerald-400' : 'text-gray-700'} size={20} />
      </button>
      <div className="space-y-1">
        <h3 className={`text-lg font-medium transition-all leading-tight ${task.completed ? "text-gray-600 line-through" : "text-gray-100"}`}>
          {task.title}
        </h3>
        {task.description && <p className="text-xs text-gray-500 font-light max-w-sm line-clamp-1">{task.description}</p>}
      </div>
    </div>

    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
      <button 
        type="button"
        onClick={onEdit}
        title="Editar registro"
        aria-label={`Editar tarefa ${task.title}`}
        className="p-3 text-gray-400 hover:text-white bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
      >
        <FiEdit3 size={16} />
      </button>
      <button 
        type="button"
        onClick={onDelete}
        title="Excluir registro"
        aria-label={`Apagar tarefa ${task.title}`}
        className="p-3 text-gray-400 hover:text-red-400 bg-white/5 rounded-xl border border-white/10 hover:bg-red-500/5 transition-all cursor-pointer"
      >
        <FiTrash2 size={16} />
      </button>
    </div>
  </motion.div>
);

const LoadingScreen = () => (
  <div className="h-screen bg-black flex flex-col items-center justify-center">
    <div className="relative w-20 h-20">
      <div className="absolute inset-0 border-t-2 border-blue-600 rounded-full animate-spin" />
    </div>
    <span className="mt-10 text-[10px] font-black uppercase tracking-[0.5em] text-gray-600 animate-pulse">Sincronizando Nexus</span>
  </div>
);

export default function ClientDashboard() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <DashboardContent />
    </Suspense>
  );
}