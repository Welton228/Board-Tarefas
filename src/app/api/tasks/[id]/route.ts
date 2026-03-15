/**
 * ✅ MELHORIA 1: Removido o runtime "nodejs" para evitar conflito com o Middleware (Edge).
 * ✅ MELHORIA 2: Adicionado force-dynamic para garantir leitura de sessão em tempo real.
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma'; // Utilizando alias para consistência
import { auth } from '@/src/auth';   // Importando da mesma instância do Middleware

/**
 * 🔵 PUT - Atualizar tarefa
 */
export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    // Se o auth() falha aqui em produção, o problema era o conflito de runtime
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await req.json();
    const { title, description, completed } = body;

    // Busca a tarefa para verificar propriedade
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { userId: true }
    });

    if (!task) {
      return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });
    }

    if (task.userId !== session.user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Atualização com Clean Code (Objeto dinâmico)
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
    console.error('[TASK_UPDATE_ERROR]:', error.message);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * 🔴 DELETE - Excluir tarefa
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

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { userId: true }
    });

    if (!task || task.userId !== session.user.id) {
      return NextResponse.json({ error: 'Não permitido' }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[TASK_DELETE_ERROR]:', error.message);
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 });
  }
}