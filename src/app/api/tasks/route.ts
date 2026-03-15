export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { auth } from '@/src/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description } = body;

    // 🛡️ VALIDAÇÃO DE CAMPO OBRIGATÓRIO (Clean Code)
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'O título é obrigatório' }, { status: 400 });
    }

    // Criação no banco usando o userId da sessão garantida pelo seu Schema
    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        userId: session.user.id, // Aqui usamos o ID que vem do auth()
      },
    });

    return NextResponse.json(newTask, { status: 201 });

  } catch (error: any) {
    console.error('[TASK_POST_ERROR]:', error.message);
    return NextResponse.json({ error: 'Erro ao criar tarefa' }, { status: 500 });
  }
}

/**
 * 💡 DICA: O método GET para listar as tarefas também deve seguir este padrão
 * de buscar apenas onde userId === session.user.id.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const tasks = await prisma.task.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar tarefas' }, { status: 500 });
  }
}