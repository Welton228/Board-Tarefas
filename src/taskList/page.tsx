'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FiCheckCircle, FiCircle, FiLoader } from 'react-icons/fi';

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface TaskListProps {
  initialTasks?: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ initialTasks = [] }) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /**
   * 📡 BUSCA DE DADOS
   * Carrega as tarefas da API ao montar o componente.
   */
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/tasks');
        
        // Redireciona se a sessão não for encontrada ou expirar
        if (response.status === 401) {
          router.push('/login');
          return;
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          setTasks(data);
        }
      } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [router]);

  // Loader centrizado com animação
  if (loading) {
    return (
      <div className="flex justify-center p-10 text-blue-500">
        <FiLoader className="animate-spin text-3xl" aria-label="Carregando tarefas" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* ✅ Atualizado: bg-linear-to-r (Tailwind v4) */}
      <h3 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-6">
        Minhas Tarefas
      </h3>
      
      {tasks.length > 0 ? (
        /* 📜 Lista Animada: Usamos motion.ul para conter os itens li */
        <motion.ul className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {tasks.map((task, index) => (
              <motion.li
                key={task.id}
                layout // Suaviza a reordenação da lista
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.05 // Efeito cascata na entrada
                }}
                className="group flex items-start gap-4 p-5 bg-gray-900/40 backdrop-blur-md border border-white/5 rounded-2xl hover:border-blue-500/50 transition-all shadow-lg"
              >
                {/* Ícone de Status */}
                <div className="mt-1 text-blue-500 transition-transform group-hover:scale-110">
                  {task.completed ? <FiCheckCircle size={22} /> : <FiCircle size={22} />}
                </div>
                
                {/* Conteúdo da Tarefa */}
                <div className="flex-1">
                  <h4 className={`text-lg font-semibold transition-colors ${
                    task.completed ? 'text-gray-500 line-through' : 'text-gray-100'
                  }`}>
                    {task.title}
                  </h4>
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      ) : (
        /* 📭 Estado Vazio: Layout amigável quando não há dados */
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-gray-900/20 rounded-3xl border-2 border-dashed border-gray-800"
        >
          <p className="text-gray-500 font-medium">Nenhuma tarefa encontrada.</p>
          <p className="text-gray-600 text-sm">Que tal criar uma agora?</p>
        </motion.div>
      )}
    </div>
  );
};

export default TaskList;