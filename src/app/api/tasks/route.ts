export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; 
import { auth } from '@/src/auth';

/**
 * 🛠️ HELPER: VALIDAÇÃO DE SESSÃO E ID
 * Converte o ID da URL para número e valida a sessão do usuário.
 */
async function getContext(req: NextRequest) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get('id');
  
  // Converte string "1" para número 1. Se não for número, retorna NaN.
  const id = idParam ? Number(idParam) : null;
  const userId = session?.user?.id;

  return { userId, id };
}

/**
 * 📋 GET: LISTAGEM DE TAREFAS
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const tasks = await prisma.task.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('[TASK_GET_ERROR]:', error.message);
    return NextResponse.json({ error: 'Erro ao buscar tarefas' }, { status: 500 });
  }
}

/**
 * 📝 POST: CRIAÇÃO DE TAREFA
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await getContext(req);
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { title, description } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'O título é obrigatório' }, { status: 400 });
    }

    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        userId: userId,
        completed: false,
      },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error: any) {
    console.error('[TASK_POST_ERROR]:', error.message);
    return NextResponse.json({ error: 'Erro ao criar tarefa' }, { status: 500 });
  }
}

/**
 * 🔄 PATCH: ATUALIZAÇÃO DE TAREFA
 */
export async function PATCH(req: NextRequest) {
  try {
    const { userId, id } = await getContext(req);
    
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (!id || isNaN(id)) return NextResponse.json({ error: 'ID numérico inválido' }, { status: 400 });

    const body = await req.json();

    // 🛡️ Verifica se a tarefa existe e pertence ao usuário
    const task = await prisma.task.findFirst({ 
      where: { id: id, userId: userId } 
    });

    if (!task) return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });

    const updatedTask = await prisma.task.update({
      where: { id: id }, // O Prisma agora recebe um Number
      data: {
        title: body.title?.trim() || undefined,
        description: body.description?.trim() || undefined,
        completed: typeof body.completed === 'boolean' ? body.completed : undefined,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error('[TASK_PATCH_ERROR]:', error.message);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}

/**
 * 🗑️ DELETE: REMOÇÃO DE TAREFA
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId, id } = await getContext(req);

    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (!id || isNaN(id)) return NextResponse.json({ error: 'ID numérico inválido' }, { status: 400 });

    // 🛡️ Verifica propriedade antes de deletar
    const task = await prisma.task.findFirst({ 
      where: { id: id, userId: userId } 
    });

    if (!task) return NextResponse.json({ error: 'Registro não autorizado' }, { status: 404 });

    await prisma.task.delete({
      where: { id: id } // O Prisma agora recebe um Number
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[TASK_DELETE_ERROR]:', error.message);
    return NextResponse.json({ error: 'Erro ao remover' }, { status: 500 });
  }
}