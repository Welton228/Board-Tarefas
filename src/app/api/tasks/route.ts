// app/api/tasks/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from '@/lib/auth'; // wrapper do next-auth/jwt
import type { NextRequest } from 'next/server';

/**
 * Estrutura de uma tarefa
 */
interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  userId: string;
  createdAt: Date;
}

/**
 * GET /api/tasks
 * Lista todas as tarefas do usuário autenticado.
 */
export async function GET(req: NextRequest) {
  try {
    // Recupera token decodificado
    const token = await getToken(req);

    // Verifica se o token é válido e possui o ID do usuário
    if (!token || !token.id) {
      return NextResponse.json(
        { error: 'Sessão expirada ou inválida. Faça login novamente.' },
        { status: 401 }
      );
    }

    // Busca tarefas do usuário autenticado
    const tasks: Task[] = await prisma.task.findMany({
      where: { userId: token.id },
      orderBy: { createdAt: 'desc' }, // Mais recentes primeiro
    });

    // Retorna as tarefas
    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('[GET TASKS ERROR]', error);

    return NextResponse.json(
      {
        error: 'Erro ao buscar tarefas',
        ...(process.env.NODE_ENV === 'development' && { details: error.message }),
      },
      { status: 500 }
    );
  }
}
