/**
 * ⚙️ CONFIGURAÇÕES DE RUNTIME
 * force-dynamic: Garante que o Next.js não tente gerar essa rota como estática no build.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma"; // Recomendado usar aliases (@/)
import { auth } from "@/src/auth";

/**
 * 🟢 GET - Buscar todas as tarefas do usuário logado
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();

    // Verificação robusta de sessão
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Sessão inválida ou expirada" }, 
        { status: 401 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);

  } catch (error: any) {
    console.error("[API_TASKS_GET]:", error.message);
    return NextResponse.json(
      { error: "Erro ao buscar tarefas" }, 
      { status: 500 }
    );
  }
}

/**
 * 🔵 POST - Criar uma nova tarefa
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      console.warn("[API_TASKS_POST]: Tentativa de criação sem sessão ativa.");
      return NextResponse.json(
        { error: "Não autorizado" }, 
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, description } = body;

    // Validação de campos obrigatórios (Clean Code: Early Return)
    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: "Título e descrição são obrigatórios" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        completed: false,
        userId: session.user.id,
      },
    });

    return NextResponse.json(task, { status: 201 });

  } catch (error: any) {
    console.error("[API_TASKS_POST]:", error.message);
    
    // Tratamento específico para erros do Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Já existe uma tarefa com este título" }, 
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno ao salvar tarefa" }, 
      { status: 500 }
    );
  }
}