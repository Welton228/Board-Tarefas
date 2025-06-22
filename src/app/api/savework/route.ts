import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma"; // Corrigido: importação padrão em vez de importação nomeada
import { ZodError, z } from "zod";

/**
 * Esquema de validação para tarefas usando Zod
 * Define a estrutura e regras de validação para os dados da tarefa
 */
const taskSchema = z.object({
  title: z.string()
    .min(3, "Título deve ter pelo menos 3 caracteres")
    .max(100, "Título não pode exceder 100 caracteres"),
  description: z.string()
    .max(500, "Descrição não pode exceder 500 caracteres")
    .optional()
    .default(''),
  completed: z.boolean()
    .default(false),
});

/**
 * POST /api/tasks
 * Cria uma nova tarefa para o usuário autenticado
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Autenticação - Verifica se o usuário está logado
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para continuar." },
        { status: 401 }
      );
    }

    // 2. Validação dos dados de entrada
    const body = await req.json();
    const validatedData = taskSchema.parse(body);

    // 3. Verificação do usuário no banco de dados
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true } // Apenas o ID para otimização
    });

    if (!userExists) {
      return NextResponse.json(
        { error: "Usuário não encontrado. Sua conta pode ter sido removida." },
        { status: 404 }
      );
    }

    // 4. Criação da tarefa no banco de dados
    const newTask = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        completed: validatedData.completed,
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        completed: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 5. Log em ambiente de desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.log("[DEV] Tarefa criada:", {
        id: newTask.id,
        title: newTask.title,
        userId: session.user.id
      });
    }

    // 6. Resposta de sucesso
    return NextResponse.json(
      { 
        success: true,
        message: "Tarefa criada com sucesso!",
        data: newTask
      },
      { status: 201 }
    );

  } catch (error) {
    // Tratamento de erros específicos
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: "Erro de validação",
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    // Log de erro completo no servidor
    console.error("[API ERROR] /api/tasks/POST:", error);

    // Resposta genérica de erro
    return NextResponse.json(
      { 
        success: false,
        error: "Ocorreu um erro ao processar sua solicitação",
        ...(process.env.NODE_ENV === "development" && {
          debug: error instanceof Error ? error.message : String(error)
        })
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tasks
 * Lista todas as tarefas do usuário autenticado
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Autenticação
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // 2. Obter parâmetros de consulta
    const { searchParams } = new URL(req.url);
    const completed = searchParams.get('completed');
    const search = searchParams.get('search') || '';

    // 3. Consulta ao banco de dados com filtros
    const tasks = await prisma.task.findMany({
      where: {
        userId: session.user.id,
        ...(completed && { completed: completed === 'true' }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        })
      },
      select: {
        id: true,
        title: true,
        description: true,
        completed: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(
      { 
        success: true,
        data: tasks,
        count: tasks.length
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[API ERROR] /api/tasks/GET:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Erro ao buscar tarefas"
      },
      { status: 500 }
    );
  }
}