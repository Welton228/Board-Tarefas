/**
 * ⚙️ CONFIGURAÇÕES DE RUNTIME
 * IMPORTANTE: O Prisma Client padrão requer o runtime 'nodejs'. 
 * O erro 500 ocorre porque o runtime 'edge' não suporta drivers de banco de dados nativos TCP.
 */
export const runtime = "nodejs"; 
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma"; // Utilizando o alias padrão para evitar erros de path
import { auth } from "@/src/auth";

/**
 * 🟢 GET - Buscar todas as tarefas do usuário autenticado
 * Prática Clean Code: Tipagem rigorosa e tratamento de exceções.
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();

    // 1. Validação de Identidade (Acesso Protegido)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Acesso negado. Por favor, realize o login novamente." }, 
        { status: 401 }
      );
    }

    // 2. Operação de Banco de Dados
    const tasks = await prisma.task.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    // 3. Resposta de Sucesso
    return NextResponse.json(tasks, { status: 200 });

  } catch (error: any) {
    // Log detalhado para debug no terminal/Vercel Logs
    console.error("[API_TASKS_GET_ERROR]:", error.message);

    return NextResponse.json(
      { error: "Falha na sincronização das tarefas." }, 
      { status: 500 }
    );
  }
}

/**
 * 🔵 POST - Criar uma nova tarefa vinculada ao usuário
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // 1. Validação de Sessão
    if (!session?.user?.id) {
      console.warn("[API_TASKS_POST_UNAUTHORIZED]: Tentativa de criação anônima.");
      return NextResponse.json(
        { error: "Sessão expirada ou usuário não identificado." }, 
        { status: 401 }
      );
    }

    // 2. Extração e Sanitização de Dados
    const body = await req.json();
    const { title, description } = body;

    // Early Return: Validação de Payload
    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: "Os campos título e descrição são obrigatórios." },
        { status: 400 }
      );
    }

    // 3. Persistência no Banco de Dados
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        completed: false,
        userId: session.user.id,
      },
    });

    // 4. Resposta de Criação (201 Created)
    return NextResponse.json(task, { status: 201 });

  } catch (error: any) {
    console.error("[API_TASKS_POST_ERROR]:", error.message);

    // Tratamento de Erro de Conexão ou Prisma
    if (error.message.includes("Can't reach database server")) {
      return NextResponse.json(
        { error: "O servidor de banco de dados está offline ou recusou a conexão." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno ao processar a criação da tarefa." }, 
      { status: 500 }
    );
  }
}