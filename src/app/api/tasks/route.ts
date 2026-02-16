// src/app/api/tasks/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth"; // ✅ CORRETO

const prisma = new PrismaClient();


// =========================
// POST - Criar nova tarefa
// =========================
export async function POST(req: NextRequest) {
  try {
    // ✅ FORMA CORRETA no App Router
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Acesso não autorizado. Faça login." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const { title, description } = await req.json();

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

  } catch (error) {
    console.error("Erro ao criar tarefa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}


// =========================
// GET - Buscar tarefas
// =========================
export async function GET() {
  try {
    // ✅ FORMA CORRETA
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Acesso não autorizado. Faça login." },
        { status: 401 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks, { status: 200 });

  } catch (error) {
    console.error("Erro ao buscar tarefas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar tarefas" },
      { status: 500 }
    );
  }
}
