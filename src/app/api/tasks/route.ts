export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; // 💡 Use o alias @ para caminhos mais limpos
import { auth } from '@/src/auth';

/**
 * 📝 POST: CRIAÇÃO DE TAREFA
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // 🛡️ PROTEÇÃO: Verifica se o usuário está logado
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 📦 CAPTURA DO CORPO: Tratando erro caso o body seja inválido
    const body = await req.json().catch(() => ({}));
    const { title, description } = body;

    // 🛡️ VALIDAÇÃO: Título é obrigatório e não pode ser apenas espaços
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'O título é obrigatório' }, { status: 400 });
    }

    // 💾 BANCO DE DADOS: Criação vinculada ao ID do usuário da sessão
    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        userId: session.user.id,
        completed: false, // Garante que começa como pendente
      },
    });

    return NextResponse.json(newTask, { status: 201 });

  } catch (error: any) {
    console.error('[TASK_POST_ERROR]:', error.message);
    return NextResponse.json(
      { error: 'Erro ao criar tarefa no servidor' }, 
      { status: 500 }
    );
  }
}

/**
 * 📋 GET: LISTAGEM DE TAREFAS
 * Retorna apenas as tarefas pertencentes ao usuário logado.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const tasks = await prisma.task.findMany({
      where: { 
        userId: session.user.id 
      },
      orderBy: { 
        createdAt: 'desc' 
      }
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('[TASK_GET_ERROR]:', error.message);
    return NextResponse.json(
      { error: 'Erro ao buscar tarefas' }, 
      { status: 500 }
    );
  }
}