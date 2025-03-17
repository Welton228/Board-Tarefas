import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Buscar todas as tarefas
export async function GET() {
  try {
    const tasks = await prisma.task.findMany();
    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar tarefas' },
      { status: 500 }
    );
  }
}

// Criar uma nova tarefa
export async function POST(req: Request) {
  try {
    const { title, description } = await req.json();
    const newTask = await prisma.task.create({
      data: {
        title,
        description,
      },
    });
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar tarefa' },
      { status: 500 }
    );
  }
}

// Editar uma tarefa
export async function PATCH(req: Request) {
  try {
    const { id, title, description } = await req.json();
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { title, description },
    });
    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao editar tarefa' },
      { status: 500 }
    );
  }
}

// Marcar tarefa como concluída
export async function PUT(req: Request) {
  try {
    const { id, completed } = await req.json();
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { completed },
    });
    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar tarefa' },
      { status: 500 }
    );
  }
}

// Excluir uma tarefa
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.task.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Tarefa excluída' }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao excluir tarefa' },
      { status: 500 }
    );
  }
}