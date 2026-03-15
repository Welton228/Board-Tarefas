/**
 * ⚙️ CONFIGURAÇÕES DE RUNTIME
 * IMPORTANTE: Fixamos 'nodejs' pois o Prisma Client nativo não roda no Edge Runtime.
 * 'force-dynamic' garante que a sessão seja validada a cada requisição.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma'; 
import { auth } from '@/src/auth';

/**
 * 🔵 PUT - Atualizar uma tarefa existente
 */
export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    // 1. Validação de Autenticação
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada' }, { status: 401 });
    }

    // 2. Validação do ID (Prisma usa Int ou String dependendo do seu schema)
    // Se no seu schema o ID for String (UUID/CUID), remova o parseInt.
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Formato de ID inválido' }, { status: 400 });
    }

    const body = await req.json();
    const { title, description, completed } = body;

    // 3. Verificação de Propriedade (Segurança)
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { userId: true }
    });

    if (!task) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    if (task.userId !== session.user.id) {
      return NextResponse.json({ error: 'Acesso negado: você não é o dono desta tarefa' }, { status: 403 });
    }

    // 4. Atualização Atômica
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(typeof completed === 'boolean' && { completed })
      }
    });

    return NextResponse.json(updatedTask, { status: 200 });

  } catch (error: any) {
    console.error('[TASK_UPDATE_ERROR]:', error.message);
    return NextResponse.json({ error: 'Erro interno ao atualizar tarefa' }, { status: 500 });
  }
}

/**
 * 🔴 DELETE - Excluir uma tarefa
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

    // 1. Busca para verificar se a tarefa pertence ao usuário antes de deletar
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { userId: true }
    });

    if (!task) {
      return NextResponse.json({ error: 'Tarefa já foi removida ou não existe' }, { status: 404 });
    }

    if (task.userId !== session.user.id) {
      return NextResponse.json({ error: 'Permissão negada para excluir esta tarefa' }, { status: 403 });
    }

    // 2. Exclusão definitiva
    await prisma.task.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ message: "Tarefa excluída com sucesso" }, { status: 200 });

  } catch (error: any) {
    console.error('[TASK_DELETE_ERROR]:', error.message);
    return NextResponse.json({ error: 'Erro técnico ao processar exclusão' }, { status: 500 });
  }
}