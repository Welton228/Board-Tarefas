'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

interface CreateTaskFormProps {
    onTaskCreated: () => void;
}

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ onTaskCreated }) => {
    const { data: session, status } = useSession();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (status === 'loading') {
        return <p>Carregando...</p>;
    }

    if (!session) {
        return <p>Você precisa estar logado para criar uma tarefa.</p>;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session?.user?.id) {
            setError('Você precisa estar logado para criar uma tarefa.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}` // Alterado para usar accessToken
                },
                body: JSON.stringify({ 
                    title, 
                    description
                    // Removido userId do body pois será obtido do token no backend
                }),
            });

            if (response.ok) {
                onTaskCreated();
                setTitle('');
                setDescription('');
            } else {
                const errorData = await response.json();
                setError(`Erro ao criar tarefa: ${errorData.error || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error('Erro ao criar tarefa:', error);
            setError('Erro ao criar tarefa. Verifique o console para mais detalhes.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <input
                type="text"
                placeholder="Título"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
            />
            <textarea
                placeholder="Descrição"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
            />
            {error && (
                <p className="text-red-500 text-sm">{error}</p>
            )}
            <button
                type="submit"
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 disabled:opacity-50"
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Criando...' : 'Criar Tarefa'}
            </button>
        </form>
    );
};

export default CreateTaskForm;