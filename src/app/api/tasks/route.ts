import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Middleware para verificar autenticação
async function getSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }
  return session;
}

// Buscar todas as tarefas do usuário logado
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const tasks = await prisma.task.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        title: true,
        description: true,
        completed: true,
        createdAt: true,
        userId: true,
      },
    }) || []; // Se retornar null, define como array vazio

    return NextResponse.json(tasks, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao buscar tarefas', details: error.message },
      { status: 500 }
    );
  }
}

// Criar uma nova tarefa para o usuário logado
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { title, description } = await req.json();
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Título e descrição são obrigatórios' },
        { status: 400 }
      );
    }

    const newTask = await prisma.task.create({
      data: { title, description, userId: session.user.id },
      select: {
        id: true,
        title: true,
        description: true,
        completed: true,
        createdAt: true,
        userId: true,
      },
    });
    return NextResponse.json(newTask, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao criar tarefa', details: error.message },
      { status: 500 }
    );
  }
}

// Função para verificar se a tarefa pertence ao usuário logado
async function getTask(id: string, userId: string) {
  return await prisma.task.findUnique({ where: { id, userId } });
}

// Editar uma tarefa do usuário logado
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id, title, description } = await req.json();
    if (!id || !title || !description) {
      return NextResponse.json(
        { error: 'ID, título e descrição são obrigatórios' },
        { status: 400 }
      );
    }

    const task = await getTask(id, session.user.id);
    if (!task) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { title, description },
      select: {
        id: true,
        title: true,
        description: true,
        completed: true,
        createdAt: true,
        userId: true,
      },
    });
    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao editar tarefa', details: error.message },
      { status: 500 }
    );
  }
}

// Marcar tarefa como concluída
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id, completed } = await req.json();
    if (!id || typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'ID e status de conclusão são obrigatórios' },
        { status: 400 }
      );
    }

    const task = await getTask(id, session.user.id);
    if (!task) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { completed },
    });
    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao atualizar tarefa', details: error.message },
      { status: 500 }
    );
  }
}

// Excluir uma tarefa do usuário logado
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json(
        { error: 'ID da tarefa é obrigatório' },
        { status: 400 }
      );
    }

    const task = await getTask(id, session.user.id);
    if (!task) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json(
      { message: 'Tarefa excluída com sucesso' },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao excluir tarefa', details: error.message },
      { status: 500 }
    );
  }
}
