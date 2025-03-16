// Importa a instância do Prisma Client
import { prisma } from '@/lib/prisma';
// Importa os tipos NextRequest e NextResponse do Next.js
import { NextResponse, NextRequest } from 'next/server';

// Define a função GET para buscar todas as tarefas
export async function GET() {
  try {
    // Busca todas as tarefas no banco de dados
    const tasks = await prisma.task.findMany();
    // Retorna as tarefas como JSON com status 200 (OK)
    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    // Se ocorrer um erro, retorna uma mensagem de erro com status 500 (Internal Server Error)
    return NextResponse.json(
      { error: 'Erro ao buscar tarefas' },
      { status: 500 }
    );
  }
}

// Define a função POST para criar uma nova tarefa
export async function POST(req: NextRequest) {
  try {
    // Extrai o corpo da requisição
    const { title, description } = await req.json();
    // Cria a tarefa no banco de dados usando o Prisma Client
    const newTask = await prisma.task.create({
      data: {
        title,
        description,
      },
    });
    // Retorna a nova tarefa criada com status 201 (Created)
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    // Se ocorrer um erro, retorna uma mensagem de erro com status 500 (Internal Server Error)
    return NextResponse.json(
      { error: 'Erro ao criar tarefa' },
      { status: 500 }
    );
  }
}