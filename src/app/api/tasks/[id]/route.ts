export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth'; // ✅ Usando a versão v5 correta

/**
 * PUT /api/tasks/[id]
 * Atualiza título, descrição ou status da tarefa.
 */
export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> } // No Next.js 15, params é uma Promise
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'ID da tarefa inválido' }, { status: 400 });
    }

    const body = await req.json();
    const { title, description, completed } = body;

    // 1. Verifica se a tarefa existe e pertence ao usuário
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { userId: true }
    });

    if (!task) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    if (task.userId !== session.user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // 2. Executa a atualização (Clean Code: montagem dinâmica do objeto)
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(typeof completed === 'boolean' && { completed })
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error('[TASK_UPDATE_ERROR]', error.message);
    return NextResponse.json({ error: 'Erro ao atualizar tarefa' }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks/[id]
 * Exclui a tarefa de forma segura.
 */
export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Verifica propriedade antes de deletar
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { userId: true }
    });

    if (!task || task.userId !== session.user.id) {
      return NextResponse.json({ error: 'Tarefa não encontrada ou acesso negado' }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[TASK_DELETE_ERROR]', error.message);
    return NextResponse.json({ error: 'Erro ao excluir tarefa' }, { status: 500 });
  }
}