import { ReactNode, Suspense } from "react";
import localFont from "next/font/local";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast"; // 🟢 Importação da lib de notificações

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
   * ✅ ESTRATÉGIA MANTIDA: 
   * A sessão não é passada via prop para evitar conflitos de hidratação.
   * O Toaster foi adicionado fora do main para sobrepor toda a interface.
   */

  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={`
        ${geistSans.variable} 
        ${geistMono.variable} 
        font-sans antialiased 
        bg-gray-950 text-gray-100 min-h-screen
      `}>
        
        <SessionProvider 
          refetchInterval={5 * 60} 
          refetchOnWindowFocus={true}
        >
          {/* 🔔 CONFIGURAÇÃO DO TOASTER
              As configurações abaixo garantem que as notificações 
              sigam o design dark do seu Nexus Task.
          */}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#111827', // Gray-900
                color: '#f3f4f6',      // Gray-100
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
              },
              success: {
                iconTheme: {
                  primary: '#3b82f6', // Blue-500 para combinar com o tema
                  secondary: '#fff',
                },
              },
            }}
          />

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