import { NextRequest, NextResponse } from "next/server"; // Importando NextRequest e NextResponse para manipulação de requisições e respostas no Next.js
import { getServerSession } from "next-auth"; // Importando a função getServerSession para obter a sessão do usuário autenticado
import { authOptions } from "@/lib/auth"; // Importando as opções de autenticação do NextAuth
import { prisma } from "@/lib/prisma"; // Importando o Prisma para interagir com o banco de dados
import { ZodError, z } from "zod"; // Importando o Zod para validação de dados

// Esquema de validação com Zod
const taskSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"), // Título deve ter no mínimo 3 caracteres
  description: z.string().default(''), // A descrição é opcional, mas se não for fornecida, será uma string vazia
  completed: z.boolean().default(false), // A tarefa será marcada como não concluída por padrão
});

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticação: verificar se o usuário está autenticado e tem um id válido
    const session = await getServerSession(authOptions); // Obtendo a sessão do usuário com base nas opções de autenticação
    if (!session?.user?.id) { // Verificando se o id do usuário existe na sessão
      return NextResponse.json(
        { error: "Não autorizado" }, // Caso o usuário não esteja autenticado, retornar erro 401
        { status: 401 }
      );
    }

    // 2. Validar dados da requisição: garantir que os dados da requisição estejam corretos
    const body = await req.json(); // Obtendo os dados do corpo da requisição
    console.log("Dados recebidos:", body); // Log de depuração para inspecionar os dados recebidos
    const validatedData = taskSchema.parse(body); // Validando os dados recebidos com o Zod

    // 3. Verificar existência do usuário no banco de dados
    const user = await prisma.user.findUnique({ // Verificando se o usuário existe no banco de dados
      where: {
        id: session.user.id, // Buscando pelo id do usuário presente na sessão
      },
    });

    if (!user) { // Caso o usuário não exista, retornar erro 404
      return NextResponse.json(
        { error: "Usuário não encontrado no banco de dados" },
        { status: 404 }
      );
    }

    // 4. Salvar no banco de dados: criar a nova tarefa associada ao usuário logado
    const newTask = await prisma.task.create({ // Criando a nova tarefa no banco de dados
      data: {
        title: validatedData.title, // Usando o título validado
        description: validatedData.description, // Usando a descrição validada
        completed: validatedData.completed, // Usando o status de conclusão validado
        userId: session.user.id, // Associando a tarefa ao id do usuário logado
      },
      select: {
        id: true, // Selecionando apenas os campos necessários
        title: true,
        description: true,
        completed: true,
        createdAt: true, // Incluindo a data de criação
      },
    });

    // 5. Log de sucesso (apenas em desenvolvimento)
    if (process.env.NODE_ENV === "development") { // Em desenvolvimento, logar a tarefa criada
      console.log("Tarefa criada:", newTask);
    }

    // 6. Retornar resposta: retornar a resposta de sucesso com o novo task
    return NextResponse.json(
      { 
        message: "Tarefa salva com sucesso!", // Mensagem de sucesso
        task: newTask // Retornando os dados da nova tarefa criada
      },
      { status: 201 } // Código HTTP 201 para criação bem-sucedida
    );

  } catch (error: any) {
    // Tratamento de erros detalhado
    if (error instanceof ZodError) { // Verificando se o erro é do Zod (erro de validação)
      return NextResponse.json(
        { 
          error: "Dados inválidos", // Mensagem de erro genérica
          details: error.errors // Detalhes do erro de validação
        },
        { status: 400 } // Código HTTP 400 para erro de validação
      );
    }

    // Log de erro no servidor (em produção, este erro não será exposto ao usuário)
    console.error("Erro ao salvar tarefa:", error);
    
    // Resposta de erro genérico
    return NextResponse.json(
      { 
        error: "Erro ao processar a requisição", // Mensagem genérica para erro no processamento
        details: process.env.NODE_ENV === "development" ? error.message : null // Exibindo detalhes do erro em desenvolvimento
      },
      { status: 500 } // Código HTTP 500 para erro no servidor
    );
  }
}
