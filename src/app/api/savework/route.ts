import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { tarefa } = await req.json();
    console.log("Tarefa recebida:", tarefa);

    return NextResponse.json({ message: "Tarefa salva com sucesso!" });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao processar a requisição" },
      { status: 500 }
    );
  }
}
