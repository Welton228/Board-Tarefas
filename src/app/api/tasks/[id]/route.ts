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
      return NextResponse.json({ error: 'ID inválido. O ID da tarefa deve ser um número.' }, { status: 400 });
    }

    // Verifica o token de autenticação do usuário
    const token = await getToken(req);
    if (!token?.id || typeof token.id !== 'string') {
      return NextResponse.json({ error: 'Não autorizado. Token inválido ou ausente.' }, { status: 401 });
    }

    // Obtém os dados enviados no corpo da requisição (JSON)
    const body = await req.json();
    const { title, description, completed } = body;

    // Valida os dados recebidos
    if (title && typeof title !== 'string') {
      return NextResponse.json({ error: 'Título inválido. O título deve ser uma string.' }, { status: 400 });
    }

    if (description && typeof description !== 'string') {
      return NextResponse.json({ error: 'Descrição inválida. A descrição deve ser uma string.' }, { status: 400 });
    }

    // Verifica se a tarefa com o 'id' existe no banco de dados
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    // Se a tarefa não existir ou não pertencer ao usuário, retorna erro 403
    if (!existingTask || existingTask.userId !== token.id) {
      return NextResponse.json({ error: 'Tarefa não encontrada ou não pertence ao usuário.' }, { status: 403 });
    }

    // Atualiza a tarefa com os novos dados, se fornecidos
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title: title.trim() }), // Atualiza o título se fornecido
        ...(description !== undefined && { description: description.trim() || null }), // Atualiza a descrição, ou define como null se vazio
        ...(typeof completed === 'boolean' && { completed }), // Atualiza o status de completado se fornecido
      },
    });

    // Retorna a tarefa atualizada como resposta
    return NextResponse.json(updatedTask);
  } catch (error: any) {
    // Em caso de erro, loga o erro e retorna uma mensagem de erro genérica
    console.error('[PUT TASK ERROR]', error);
    return NextResponse.json({ error: 'Erro ao atualizar tarefa. Por favor, tente novamente.' }, { status: 500 });
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
      return NextResponse.json({ error: 'ID inválido. O ID da tarefa deve ser um número.' }, { status: 400 });
    }

    // Verifica o token de autenticação do usuário
    const token = await getToken(req);
    if (!token?.id || typeof token.id !== 'string') {
      return NextResponse.json({ error: 'Não autorizado. Token inválido ou ausente.' }, { status: 401 });
    }

    // Verifica se a tarefa com o 'id' existe no banco de dados
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    // Se a tarefa não existir ou não pertencer ao usuário, retorna erro 403
    if (!task || task.userId !== token.id) {
      return NextResponse.json({ error: 'Tarefa não encontrada ou não pertence ao usuário.' }, { status: 403 });
    }

    // Exclui a tarefa do banco de dados
    await prisma.task.delete({
      where: { id: taskId },
    });

    // Retorna uma mensagem confirmando a exclusão
    return NextResponse.json({ message: 'Tarefa excluída com sucesso.' });
  } catch (error: any) {
    // Em caso de erro, loga o erro e retorna uma mensagem de erro genérica
    console.error('[DELETE TASK ERROR]', error);
    return NextResponse.json({ error: 'Erro ao excluir tarefa. Por favor, tente novamente.' }, { status: 500 });
  }
}
