import { ReactNode, Suspense } from "react";
import localFont from "next/font/local";
import { SessionProvider } from "next-auth/react";

import Header from "../components/header/header";
import "./globals.css";

// Força a página a ser dinâmica para garantir que os cookies sejam lidos sempre
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

export default function RootLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  /**
   * ✅ ESTRATÉGIA PLENO: 
   * No Next.js 15, evitamos passar a session manualmente para o Provider no RootLayout.
   * Isso evita o conflito de hidratação que causa o logout automático.
   * O Provider buscará a sessão automaticamente de forma estável.
   */

  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={`
        ${geistSans.variable} 
        ${geistMono.variable} 
        font-sans antialiased 
        bg-gray-950 text-gray-100 min-h-screen
      `}>
        
        {/* 🔐 SESSION PROVIDER OTIMIZADO
            Removida a prop 'session={session}'.
            Dessa forma, o hook useSession() no Dashboard não receberá um valor
            conflitante durante a hidratação inicial.
        */}
        <SessionProvider 
          refetchInterval={5 * 60} 
          refetchOnWindowFocus={true}
        >
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