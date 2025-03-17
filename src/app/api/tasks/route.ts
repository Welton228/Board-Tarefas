import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth'; // Configuração de autenticação
import { prisma } from '@/lib/prisma'; // Configuração do Prisma

// Buscar todas as tarefas do usuário logado
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const tasks = await prisma.task.findMany({
      where: { userId: session.user.id }, // Filtra tarefas pelo ID do usuário
      select: {
        id: true,
        title: true,
        description: true,
        completed: true,
        createdAt: true,
        userId: true, // Inclui o userId na resposta
      },
    });
    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar tarefas', details: error.message },
      { status: 500 }
    );
  }
}

// Criar uma nova tarefa para o usuário logado
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { title, description } = await req.json();

    // Validação básica dos dados
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Título e descrição são obrigatórios' },
        { status: 400 }
      );
    }

    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        userId: session.user.id, // Associa a tarefa ao usuário logado
      },
      select: {
        id: true,
        title: true,
        description: true,
        completed: true,
        createdAt: true,
        userId: true, // Inclui o userId na resposta
      },
    });
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar tarefa', details: error.message },
      { status: 500 }
    );
  }
}

// Editar uma tarefa do usuário logado
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id, title, description } = await req.json();

    // Validação básica dos dados
    if (!id || !title || !description) {
      return NextResponse.json(
        { error: 'ID, título e descrição são obrigatórios' },
        { status: 400 }
      );
    }

    // Verifica se a tarefa pertence ao usuário logado
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== session.user.id) {
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
        userId: true, // Inclui o userId na resposta
      },
    });
    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao editar tarefa', details: error.message },
      { status: 500 }
    );
  }
}

// Marcar tarefa como concluída (apenas para o usuário logado)
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id, completed } = await req.json();

    // Validação básica dos dados
    if (!id || typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'ID e status de conclusão são obrigatórios' },
        { status: 400 }
      );
    }

    // Verifica se a tarefa pertence ao usuário logado
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { completed },
      select: {
        id: true,
        title: true,
        description: true,
        completed: true,
        createdAt: true,
        userId: true, // Inclui o userId na resposta
      },
    });
    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar tarefa', details: error.message },
      { status: 500 }
    );
  }
}

// Excluir uma tarefa do usuário logado
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id } = await req.json();

    // Validação básica dos dados
    if (!id) {
      return NextResponse.json(
        { error: 'ID da tarefa é obrigatório' },
        { status: 400 }
      );
    }

    // Verifica se a tarefa pertence ao usuário logado
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json(
      { message: 'Tarefa excluída com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao excluir tarefa', details: error.message },
      { status: 500 }
    );
  }
}