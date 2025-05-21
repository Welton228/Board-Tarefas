"use client";

import localFont from "next/font/local";
import "./globals.css";
import Header from "./header/page";
import { SessionProvider } from "next-auth/react";
import { ReactNode, Suspense } from "react"; // Adicionado import do Suspense
import { Session } from "next-auth";

// Fontes (mantidas exatamente como no original)
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
  session?: Session;
}

export default function RootLayout({ children, session }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <SessionProvider session={session}>
          {/* Header mantido exatamente como estava */}
          <Header />
          
          {/* Main com Suspense boundary envolvendo children */}
          <main className="pt-20 min-h-[calc(100vh-64px)]">
            <Suspense 
              fallback={
                <div className="flex justify-center items-center h-full">
                  {/* Loader estilizado que combina com seu tema */}
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              }
            >
              {children}
            </Suspense>
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}