import { ReactNode, Suspense } from "react";
import localFont from "next/font/local";
import { SessionProvider } from "next-auth/react";

// Importações centrais
import { auth } from "@/src/auth"; // 💡 Use o alias @ para caminhos mais limpos
import Header from "../components/header/header"; // ✅ Importe o componente final, não a 'page'
import "./globals.css";

/**
 * 🚀 NEXT.JS 15 - CONFIGURAÇÃO DINÂMICA
 * Como o Layout consome a sessão (auth) e o SessionProvider, ele deve ser dinâmico.
 */
export const dynamic = "force-dynamic";

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

export default async function RootLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  /**
   * 🛡️ ESTRATÉGIA ANTI-DESLOGUE (Vercel)
   * Buscamos a session no servidor e passamos para o Provider.
   * O wrap em try/catch evita que o build quebre se o banco estiver offline.
   */
  let session = null;
  try {
    session = await auth();
  } catch (error) {
    console.error("[AUTH_LAYOUT_ERROR]:", error);
  }

  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={`
        ${geistSans.variable} 
        ${geistMono.variable} 
        font-sans antialiased 
        bg-gray-950 text-gray-100 min-h-screen
      `}>
        
        {/* 🔐 SESSION PROVIDER
            refetchInterval: 5 min - Mantém o cookie de sessão ativo na Vercel.
            refetchOnWindowFocus: true - Revalida o login quando o usuário volta à aba.
        */}
        <SessionProvider 
          session={session}
          refetchInterval={5 * 60} 
          refetchOnWindowFocus={true}
        >
          {/* O Header deve estar fora do <main> para ser fixo e consistente */}
          <Header />
          
          <main className="relative pt-20 min-h-screen">
            <Suspense fallback={<LoadingFallback />}>
              {children}
            </Suspense>
          </main>
        </SessionProvider>

      </body>
    </html>
  );
}

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500 border-r-transparent"></div>
      <p className="text-blue-300/60 text-sm font-medium animate-pulse">
        Sincronizando...
      </p>
    </div>
  );
}