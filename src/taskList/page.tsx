'use client';

// React
import { useEffect, useState } from 'react';

// Define o tipo de uma tarefa
interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

// Define as props do componente
interface TaskListProps {
  initialTasks?: Task[]; // Lista inicial de tarefas (opcional)
}

const TaskList: React.FC<TaskListProps> = ({ initialTasks = [] }) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // Carrega as tarefas no cliente
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/tasks'); // Substitua pela sua API
        const data = await response.json();
        if (Array.isArray(data)) {
          setTasks(data);
        } else {
          console.error('Resposta da API não é um array:', data);
        }
      } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
      }
    };

    fetchTasks();
  }, []);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Tarefas</h3>
      <ul className="space-y-2">
        {/* Verifica se há tarefas antes de mapear */}
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <li key={task.id} className="p-2 border rounded">
              <h4 className="font-bold">{task.title}</h4>
              <p>{task.description}</p>
            </li>
          ))
        ) : (
          <p>Nenhuma tarefa encontrada.</p> // Mensagem para lista vazia
        )}
      </ul>
    </div>
  );
};

export default TaskList;