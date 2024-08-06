"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ThemeProvider } from "./ThemeProvider";

export default function SessionProvider({ children, session }: any) {
  return (
    <NextAuthSessionProvider session={session}>
      <ThemeProvider>{children}</ThemeProvider>
    </NextAuthSessionProvider>
  );
}
