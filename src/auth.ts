// src/auth.ts
import { getServerSession } from 'next-auth';
import { authOptions } from './lib/auth';

// Função reutilizável para SSR/Server Component
export async function auth() {
  return await getServerSession(authOptions);
}
