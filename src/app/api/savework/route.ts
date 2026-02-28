export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../src/auth"; // ✅ Mudança para o padrão Auth.js v5
import prisma from "../../../lib/prisma";
import { ZodError, z } from "zod";

/**
 * 📝 Esquema de validação com Zod
 * Centralizado para manter o Clean Code e evitar repetições.
 */
const taskSchema = z.object({
  title: z.string()
    .min(3, "O título deve ter pelo menos 3 caracteres")
    .max(100, "O título não pode exceder 100 caracteres"),
  description: z.string()
    .max(500, "A descrição não pode exceder 500 caracteres")
    .optional()
    .default(''),
  completed: z.boolean().default(false),
});

/**
 * 🚀 POST - Salvar Trabalho/Tarefa
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Autenticação v5 (Mais estável no Next.js 15)
    const session = await auth();
    
    if (!session?.user?.id) {
      console.warn("[SAVEWORK_POST] Tentativa de acesso sem sessão válida.");
      return NextResponse.json(
        { success: false, error: "Sessão expirada. Por favor, faça login novamente." },
        { status: 401 }
      );
    }

    // 2. Validação de dados
    const body = await req.json();
    const validatedData = taskSchema.parse(body);

    // 3. Persistência no Banco de Dados
    // Usamos o ID da sessão garantido pelo Auth.js
    const newTask = await prisma.task.create({
      data: {
        title: validatedData.title.trim(),
        description: validatedData.description.trim(),
        completed: validatedData.completed,
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        completed: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        message: "Trabalho salvo com sucesso!", 
        data: newTask 
      }, 
      { status: 201 }
    );

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Erro de validação", 
          details: error.errors.map(e => e.message) 
        }, 
        { status: 400 }
      );
    }

    console.error("[API_ERROR_SAVEWORK]:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao salvar os dados." },
      { status: 500 }
    );
  }
}

/**
 * 🔍 GET - Recuperar Trabalhos Salvos
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const tasks = await prisma.task.findMany({
      where: {
        userId: session.user.id,
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        })
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ 
      success: true, 
      data: tasks 
    }, { status: 200 });

  } catch (error) {
    console.error("[API_ERROR_GET_SAVEWORK]:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao carregar os dados." },
      { status: 500 }
    );
  }
}