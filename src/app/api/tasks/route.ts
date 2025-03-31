import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  // 1. Verificação inicial da sessão
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Não autorizado - Faça login primeiro' }, 
      { 
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  try {
    // 2. Verificação do corpo da requisição
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Formato JSON inválido' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const { title, description } = body;
    
    // 3. Validação dos campos obrigatórios
    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: 'Título e descrição são obrigatórios e não podem estar vazios' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
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
        createdAt: true
      }
    });

    // 5. Resposta de sucesso
    return NextResponse.json(newTask, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    // 6. Tratamento de erros do banco de dados
    console.error('Erro ao criar tarefa:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro ao processar sua solicitação',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}