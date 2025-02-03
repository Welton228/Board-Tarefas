"use client"; // Marca este componente como Client Component

import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth"; // Importe o tipo `Session`

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null; // Use o tipo `Session` para a sessão
}) {
  return (
  <SessionProvider session={session}>{children}</SessionProvider>

  );
}