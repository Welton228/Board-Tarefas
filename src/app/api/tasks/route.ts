// app/api/tasks/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from '@/lib/auth'; // função customizada com next-auth/jwt
import type { NextRequest } from 'next/server';

/**
 * Tipagem opcional da estrutura de uma tarefa.
 * (usada para dar clareza na estrutura retornada, mas Prisma já tipa se você quiser)
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
    // Recupera token decodificado usando NextAuth
    const token = await getToken(req);

    // Garante que o token existe e contém ID de usuário
    if (!token || !token.id) {
      return NextResponse.json(
        { error: 'Sessão expirada ou inválida. Faça login novamente.' },
        { status: 401 }
      );
    }

    // Busca tarefas associadas ao usuário autenticado
    const tasks: Task[] = await prisma.task.findMany({
      where: { userId: token.id },
      orderBy: { createdAt: 'desc' }, // ordena por mais recente
    });

    // Retorna lista de tarefas como JSON
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
