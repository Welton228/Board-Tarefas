// src/app/api/tasks/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";


import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

// Inicializa o PrismaClient como uma instância global para evitar múltiplas instâncias
const prisma = new PrismaClient();

// =========================
// POST - Criar nova tarefa
// =========================
export async function POST(req: NextRequest) {
  try {
    // Verifica a sessão do usuário com as opções de autenticação
    const session = await getServerSession(authOptions);

    // Se não houver sessão ou ID de usuário, retorna não autorizado
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Acesso não autorizado. Por favor, faça login.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Verifica se o usuário existe no banco de dados
    const user = await prisma.user.findUnique({ 
      where: { id: userId } 
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' }, 
        { status: 404 }
      );
    }

    // Extrai e valida os dados da requisição
    const { title, description } = await req.json();

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: 'Título e descrição são obrigatórios' },
        { status: 400 }
      );
    }

    // Cria a nova tarefa no banco de dados
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        completed: false,
        userId,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao processar sua solicitação' },
      { status: 500 }
    );
  } finally {
    // Fecha a conexão com o Prisma
    await prisma.$disconnect();
  }
}

// =========================
// GET - Buscar tarefas do usuário
// =========================
export async function GET(req: NextRequest) {
  try {
    // Verifica a sessão do usuário
    const session = await getServerSession(authOptions);

    // Se não houver sessão válida, retorna não autorizado
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Acesso não autorizado. Por favor, faça login.' },
        { status: 401 }
      );
    }

    // Busca as tarefas do usuário ordenadas por data de criação
    const tasks = await prisma.task.findMany({
      where: { 
        userId: session.user.id 
      },
      orderBy: { 
        createdAt: 'desc' 
      },
    });

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao buscar suas tarefas' },
      { status: 500 }
    );
  } finally {
    // Fecha a conexão com o Prisma
    await prisma.$disconnect();
  }
}