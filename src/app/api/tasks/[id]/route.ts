import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from '@/lib/auth';

/**
 * PUT /api/tasks/[id]
 * Atualiza título, descrição ou status da tarefa do usuário autenticado.
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params; // Obtém o parâmetro 'id' da URL

  // Converte o 'id' de string para número
  const taskId = parseInt(id, 10);

  try {
    // Verifica se a conversão foi bem-sucedida
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Verifica o token de autenticação do usuário
    const token = await getToken(req);

    // Caso o token não seja válido ou o id do token não seja uma string, retorna erro 401
    if (!token?.id || typeof token.id !== 'string') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obtém os dados enviados no corpo da requisição (JSON)
    const body = await req.json();
    const { title, description, completed } = body;

    // Verifica se a tarefa com o 'id' existe no banco de dados
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    // Se a tarefa não existir ou não pertencer ao usuário, retorna erro 403
    if (!existingTask || existingTask.userId !== token.id) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada ou não pertence ao usuário.' },
        { status: 403 }
      );
    }

    // Atualiza a tarefa com os novos dados, se fornecidos
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title: title.trim() }), // Atualiza o título se fornecido
        ...(description !== undefined && { description: description?.trim() || null }), // Atualiza a descrição, ou define como null se vazio
        ...(typeof completed === 'boolean' && { completed }), // Atualiza o status de completado se fornecido
      },
    });

    // Retorna a tarefa atualizada como resposta
    return NextResponse.json(updatedTask);
  } catch (error: any) {
    // Em caso de erro, loga o erro e retorna uma mensagem de erro genérica
    console.error('[PUT TASK ERROR]', error);
    return NextResponse.json({ error: 'Erro ao atualizar tarefa' }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks/[id]
 * Exclui a tarefa do usuário autenticado.
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params; // Obtém o parâmetro 'id' da URL

  // Converte o 'id' de string para número
  const taskId = parseInt(id, 10);

  try {
    // Verifica se a conversão foi bem-sucedida
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Verifica o token de autenticação do usuário
    const token = await getToken(req);

    // Caso o token não seja válido ou o id do token não seja uma string, retorna erro 401
    if (!token?.id || typeof token.id !== 'string') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verifica se a tarefa com o 'id' existe no banco de dados
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    // Se a tarefa não existir ou não pertencer ao usuário, retorna erro 403
    if (!task || task.userId !== token.id) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada ou não pertence ao usuário.' },
        { status: 403 }
      );
    }

    // Exclui a tarefa do banco de dados
    await prisma.task.delete({
      where: { id: taskId },
    });

    // Retorna uma mensagem confirmando a exclusão
    return NextResponse.json({ message: 'Tarefa excluída com sucesso' });
  } catch (error: any) {
    // Em caso de erro, loga o erro e retorna uma mensagem de erro genérica
    console.error('[DELETE TASK ERROR]', error);
    return NextResponse.json({ error: 'Erro ao excluir tarefa' }, { status: 500 });
  }
}
