export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { auth } from "../../../../src/auth";

/**
 * POST - Criar nova tarefa
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Log de depuração para o seu painel Vercel
    if (!session) {
      console.error("[API_POST] Sessão não encontrada. Usuário deslogado.");
      return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
    }

    const userId = session.user?.id;
    if (!userId) {
      console.error("[API_POST] ID do usuário ausente na sessão.");
      return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description } = body;

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
        userId,
      },
    });

    return NextResponse.json(task, { status: 201 });

  } catch (error: any) {
    console.error("Erro crítico ao criar tarefa:", error.message);
    return NextResponse.json(
      { error: "Erro interno ao processar tarefa" },
      { status: 500 }
    );
  }
}

/**
 * GET - Buscar tarefas
 * No Next.js 15, passamos o 'req' mesmo que não usado para evitar cache agressivo.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      // Retornamos 401 de forma limpa. O Dashboard agora sabe lidar com isso 
      // sem deslogar imediatamente graças ao ajuste que fizemos no arquivo anterior.
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const tasks = await prisma.task.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks, { status: 200 });

  } catch (error: any) {
    console.error("Erro ao buscar tarefas no Postgres:", error.message);
    return NextResponse.json(
      { error: "Falha na conexão com o banco de dados" },
      { status: 500 }
    );
  }
}