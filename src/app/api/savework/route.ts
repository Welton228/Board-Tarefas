import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ZodError, z } from "zod";

// Esquema de validação com Zod
const taskSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  completed: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    // 1. Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // 2. Validar dados da requisição
    const body = await req.json();
    console.log("Dados recebidos:", body); // Log de depuração
    const validatedData = taskSchema.parse(body);

    // 3. Salvar no banco de dados
    const newTask = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        completed: validatedData.completed,
        userId: session.user.id, // Associa a tarefa ao usuário
      },
      select: {
        id: true,
        title: true,
        description: true,
        completed: true,
        createdAt: true,
      },
    });

    // 4. Log de sucesso (apenas em desenvolvimento)
    if (process.env.NODE_ENV === "development") {
      console.log("Tarefa criada:", newTask);
    }

    // 5. Retornar resposta
    return NextResponse.json(
      { 
        message: "Tarefa salva com sucesso!",
        task: newTask 
      },
      { status: 201 }
    );

  } catch (error: any) {
    // Tratamento de erros detalhado
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: "Dados inválidos",
          details: error.errors 
        },
        { status: 400 }
      );
    }

    console.error("Erro ao salvar tarefa:", error);
    
    return NextResponse.json(
      { 
        error: "Erro ao processar a requisição",
        details: process.env.NODE_ENV === "development" ? error.message : null
      },
      { status: 500 }
    );
  }
}
