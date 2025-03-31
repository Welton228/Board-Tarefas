"use client";
import localFont from "next/font/local";
import "./globals.css";

// Components
import Header from "./header/page";

// Auth
import { SessionProvider } from "next-auth/react";

// Fonts
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: 'swap', // Adicionado para melhor performance
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: 'swap', // Adicionado para melhor performance
});

interface RootLayoutProps {
  children: React.ReactNode;
  session?: any; // Tipagem mais específica seria ideal
}

export default function RootLayout({ children, session }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <SessionProvider session={session} refetchInterval={5 * 60}>
          <Header />
          <main className="min-h-[calc(100vh-64px)]"> {/* Ajuste para o header */}
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}