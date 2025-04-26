import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from '@/lib/auth';

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;

  try {
    const token = await getToken(req);

    if (!token?.id || typeof token.id !== 'string') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, completed } = body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask || existingTask.userId !== token.id) {
      return NextResponse.json({ error: 'Tarefa não encontrada ou não pertence ao usuário.' }, { status: 403 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(typeof completed === 'boolean' && { completed }),
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('[PUT TASK ERROR]', error);
    return NextResponse.json({ error: 'Erro ao atualizar tarefa' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;

  try {
    const token = await getToken(req);

    if (!token?.id || typeof token.id !== 'string') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task || task.userId !== token.id) {
      return NextResponse.json({ error: 'Tarefa não encontrada ou não pertence ao usuário.' }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Tarefa excluída com sucesso' });
  } catch (error) {
    console.error('[DELETE TASK ERROR]', error);
    return NextResponse.json({ error: 'Erro ao excluir tarefa' }, { status: 500 });
  }
}
