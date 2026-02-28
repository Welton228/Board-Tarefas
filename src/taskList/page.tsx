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

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/tasks');
        
        // ✅ TRATAMENTO DE SESSÃO: Essencial para seu problema de logout
        if (response.status === 401) {
          router.push('/login?error=SessionExpired');
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

  if (loading) {
    return (
      <div className="flex justify-center p-10 text-blue-500">
        <FiLoader className="animate-spin text-3xl" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-6">
        Minhas Tarefas
      </h3>
      
      <ul className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {tasks.length > 0 ? (
            tasks.map((task, index) => (
              <motion.li
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group flex items-start gap-4 p-5 bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl hover:border-blue-500/50 transition-all shadow-lg"
              >
                <div className="mt-1 text-blue-500">
                  {task.completed ? <FiCheckCircle size={22} /> : <FiCircle size={22} />}
                </div>
                
                <div className="flex-1">
                  <h4 className={`text-lg font-semibold ${task.completed ? 'text-gray-500 line-through' : 'text-gray-100'}`}>
                    {task.title}
                  </h4>
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                    {task.description}
                  </p>
                </div>
              </motion.li>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-gray-900/20 rounded-3xl border-2 border-dashed border-gray-800"
            >
              <p className="text-gray-500">Nenhuma tarefa encontrada. Que tal criar uma agora?</p>
            </motion.div>
          )}
        </AnimatePresence>
      </ul>
    </div>
  );
};

export default TaskList;