import { ReactNode, Suspense } from "react";
import localFont from "next/font/local";
import { SessionProvider } from "next-auth/react";

// Importações internas
import { auth } from "@/lib/auth"; // Importação da sua configuração central de Auth
import Header from "./header/page";
import "./globals.css";

/**
 * 🖋️ CONFIGURAÇÃO DE FONTES
 * Usando display: 'swap' para garantir que o texto seja legível durante o carregamento.
 */
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: 'swap',
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: 'swap',
});

/**
 * 🏗️ ROOT LAYOUT (SERVER COMPONENT)
 * Mantemos como Server Component para buscar a sessão via 'auth()' antes do render.
 */
export default async function RootLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  // Busca a sessão no servidor para evitar "flicker" de UI no cliente
  const session = await auth();

  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-gray-950 text-gray-100`}>
        
        {/* 🛡️ SESSION PROVIDER (CLIENT WRAPPER)
          Passamos a session vinda do servidor para hidratar o cliente imediatamente.
          refetchInterval: Resolve o deslogue automático revalidando a cada 5 min.
        */}
        <SessionProvider 
          session={session}
          refetchInterval={5 * 60} 
          refetchOnWindowFocus={true}
        >
          {/* Header global disponível em todas as rotas */}
          <Header />
          
          <main className="pt-20 min-h-[calc(100vh-64px)] relative">
            {/* ⏳ BOUNDARY DE SUSPENSE
              Protege o carregamento de componentes filhos que usam hooks como useSearchParams.
            */}
            <Suspense fallback={<LoadingFallback />}>
              {children}
            </Suspense>
          </main>
        </SessionProvider>

      </body>
    </html>
  );
}

/**
 * ✨ COMPONENTE DE LOADING (CLEAN CODE)
 * Extraído para manter o layout principal limpo e legível.
 */
function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="text-gray-400 animate-pulse">Carregando conteúdo...</p>
    </div>
  );
}