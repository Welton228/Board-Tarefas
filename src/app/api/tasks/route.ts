// app/api/tasks/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Tipagens TypeScript
interface Task {
  id: string;
  title: string;
  description: string | null; // Adicione a possibilidade de null
  completed: boolean;
  userId: string;
  createdAt: Date;
}

interface RequestBody {
  title: string;
  description: string;
}

// Métodos exportados (GET para listar, POST para criar)
export async function GET() {
  try {
    // 1. Verificação de autenticação
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado - Faça login primeiro' },
        { status: 401 }
      );
    }

    // 2. Busca tarefas no banco de dados
    const tasks: Task[] = await prisma.task.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Retorna resposta formatada
    return NextResponse.json(tasks, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    // 4. Tratamento de erros
    console.error('[GET TASKS ERROR]', error);
    
    return NextResponse.json(
      { 
        error: 'Erro ao buscar tarefas',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  // 1. Verificação de autenticação
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Não autorizado - Faça login primeiro' },
      { status: 401 }
    );
  }

  try {
    // 2. Validação do corpo da requisição
    let body: RequestBody;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Formato JSON inválido' },
        { status: 400 }
      );
    }

    const { title, description } = body;

    // 3. Validação dos campos
    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: 'Título e descrição são obrigatórios' },
        { status: 400 }
      );
    }

    // Validação de comprimento
    if (title.trim().length > 100 || description.trim().length > 500) {
      return NextResponse.json(
        { error: 'Título (máx. 100 caracteres) ou descrição (máx. 500) muito longos' },
        { status: 400 }
      );
    }

    // 4. Criação da tarefa no banco de dados
    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        completed: true,
        createdAt: true,
      },
    });

    // Log de sucesso
    console.log(`[TASK CREATED] User: ${session.user.id} | Task ID: ${newTask.id}`);

    // 5. Resposta de sucesso
    return NextResponse.json(newTask, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    // 6. Tratamento de erros
    console.error('[CREATE TASK ERROR]', error);

    return NextResponse.json(
      {
        error: 'Erro ao criar tarefa',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      { status: 500 }
    );
  }
}