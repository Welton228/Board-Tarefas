import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth"; 
import prisma from "@/src/lib/prisma";
import { ZodError, z } from "zod";

// Força a API a sempre buscar dados frescos, ignorando o cache do Next.js 15
export const dynamic = "force-dynamic";
export const revalidate = 0;

const taskSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional().default(''),
  completed: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = taskSchema.parse(body);

    // Persistência com tratamento de erro específico do Prisma
    const newTask = await prisma.task.create({
      data: {
        title: validatedData.title.trim(),
        description: validatedData.description.trim(),
        completed: validatedData.completed,
        userId: session.user.id,
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Tarefa salva com sucesso!", 
      data: newTask 
    }, { status: 201 });

  } catch (error) {
    console.error("[API_ERROR_SAVEWORK]:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: "Dados inválidos" }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: "Erro ao salvar no banco" }, { status: 500 });
  }
}
