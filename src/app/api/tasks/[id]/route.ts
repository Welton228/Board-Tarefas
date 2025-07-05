// app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Tipos para o corpo da requisição
type TaskUpdateData = {
  title?: string
  description?: string | null
  completed?: boolean
}

/**
 * PUT /api/tasks/[id]
 * Atualiza título, descrição ou status da tarefa do usuário autenticado.
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  try {
    // Verifica a sessão do usuário
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para continuar.' },
        { status: 401 }
      )
    }

    // Converte e valida o ID
    const taskId = parseInt(id, 10)
    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'ID inválido. O ID da tarefa deve ser um número.' },
        { status: 400 }
      )
    }

    // Obtém e valida os dados do corpo
    const body: TaskUpdateData = await req.json()
    const { title, description, completed } = body

    if (title && typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Título inválido. O título deve ser uma string.' },
        { status: 400 }
      )
    }

    if (description !== undefined && typeof description !== 'string' && description !== null) {
      return NextResponse.json(
        { error: 'Descrição inválida. Deve ser string ou null.' },
        { status: 400 }
      )
    }

    // Verifica existência da tarefa e permissão
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { userId: true }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada.' },
        { status: 404 }
      )
    }

    if (existingTask.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Acesso negado. Esta tarefa pertence a outro usuário.' },
        { status: 403 }
      )
    }

    // Prepara dados para atualização
    const updateData: Partial<TaskUpdateData> = {}
    
    if (title) updateData.title = title.trim()
    if (description !== undefined) {
      updateData.description = description ? description.trim() : null
    }
    if (typeof completed === 'boolean') updateData.completed = completed

    // Atualiza a tarefa
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('[TASK_UPDATE_ERROR]', error)
    return NextResponse.json(
      { error: 'Erro interno ao atualizar tarefa.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tasks/[id]
 * Exclui a tarefa do usuário autenticado.
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  try {
    // Verifica a sessão do usuário
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para continuar.' },
        { status: 401 }
      )
    }

    // Converte e valida o ID
    const taskId = parseInt(id, 10)
    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'ID inválido. O ID da tarefa deve ser um número.' },
        { status: 400 }
      )
    }

    // Verifica existência da tarefa e permissão
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { userId: true }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada.' },
        { status: 404 }
      )
    }

    if (task.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Acesso negado. Esta tarefa pertence a outro usuário.' },
        { status: 403 }
      )
    }

    // Exclui a tarefa
    await prisma.task.delete({
      where: { id: taskId }
    })

    return NextResponse.json(
      { success: true, message: 'Tarefa excluída com sucesso.' }
    )
  } catch (error) {
    console.error('[TASK_DELETE_ERROR]', error)
    return NextResponse.json(
      { error: 'Erro interno ao excluir tarefa.' },
      { status: 500 }
    )
  }
}