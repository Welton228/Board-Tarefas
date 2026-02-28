import 'next-auth';
import { DefaultSession } from "next-auth";

/**
 * 🔐 EXTENSÃO DA SESSÃO
 * Garante que quando você chamar `session.user.id` no Client ou Server,
 * o TS não reclame que 'id' não existe.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"]; // Herda name, email e image nativos
    accessToken?: string;
    error?: string; // Usado para capturar "RefreshAccessTokenError"
  }
}

/**
 * 🔑 EXTENSÃO DO JWT
 * Essencial para a lógica de renovação de token no lib/auth.ts
 */
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}