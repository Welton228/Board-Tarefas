'use client';

// React
import React from 'react';

// Define o tipo de uma tarefa
interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

// Define as props do componente
interface TaskListProps {
  tasks: Task[]; // Lista de tarefas a ser exibida
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Tarefas</h3>
      <ul className="space-y-2">
        {/* Mapeia cada tarefa e a renderiza */}
        {tasks.map((task) => (
          <li key={task.id} className="p-2 border rounded">
            <h4 className="font-bold">{task.title}</h4>
            <p>{task.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;