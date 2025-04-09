import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from '@/lib/auth';
import type { NextRequest } from 'next/server';

/**
 * GET /api/tasks
 * Lista todas as tarefas do usuário autenticado.
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken(req);

    if (!token?.id || typeof token.id !== 'string') {
      return NextResponse.json(
        { error: 'Sessão expirada ou inválida. Faça login novamente.' },
        { status: 401 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: { userId: token.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('[GET TASKS ERROR]', error);

    return NextResponse.json(
      {
        error: 'Erro ao buscar tarefas.',
        ...(process.env.NODE_ENV === 'development' && { details: error.message }),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Cria uma nova tarefa para o usuário autenticado.
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken(req);

    if (!token?.id || typeof token.id !== 'string') {
      return NextResponse.json(
        { error: 'Sessão expirada ou inválida. Faça login novamente.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, description } = body;

    // Validação do campo 'title'
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Título da tarefa é obrigatório e deve ser uma string válida.' },
        { status: 400 }
      );
    }

    // Criação da nova tarefa
    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        completed: false,
        userId: token.id,
      },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error: any) {
    console.error('[POST TASK ERROR]', error);
  
    return NextResponse.json(
      {
        error: 'Erro ao criar tarefa',
        ...(process.env.NODE_ENV === 'development' && { details: error.message }),
      },
      { status: 500 }
    );
  }  
}
