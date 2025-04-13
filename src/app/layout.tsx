"use client";

import localFont from "next/font/local";
import "./globals.css";
import Header from "./header/page";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { Session } from "next-auth";

// Fonts (mantidas exatamente como no original)
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

interface RootLayoutProps {
  children: ReactNode;
  session?: Session; // Tipagem mais específica usando o tipo Session do NextAuth
}

export default function RootLayout({ children, session }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <SessionProvider 
          session={session} 
          refetchInterval={5 * 60} // Mantido o mesmo intervalo
          refetchOnWindowFocus={true} // Adicionado para melhor gerenciamento de sessão
        >
          {/* Header mantido exatamente como estava */}
          <Header />
          
          {/* Main mantido com exatamente as mesmas classes */}
          <main className="pt-20 min-h-[calc(100vh-64px)]">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}