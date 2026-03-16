export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; // 💡 Ajustado para usar o alias padrão
import { auth } from '@/src/auth';

/**
 * 📝 POST: CRIAÇÃO DE TAREFA
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // 🛡️ PROTEÇÃO: Verifica se há usuário e se o ID existe
    // No NextAuth v5, às vezes o ID fica dentro de session.user.id como string
    if (!session?.user?.id) {
      console.error("[AUTH_CHECK]: Sessão inválida ou sem ID de usuário");
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { title, description } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'O título é obrigatório' }, { status: 400 });
    }

    // 💾 BANCO DE DADOS
    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        userId: session.user.id, // 👈 O Prisma precisa que este ID exista na tabela User
        completed: false,
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
 */
export async function GET() {
  try {
    const session = await auth();

    // 💡 LOG DE DEBUG: Verifique no terminal da Vercel se o ID está aparecendo
    console.log("Sessão ativa para o usuário:", session?.user?.email, "ID:", session?.user?.id);

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