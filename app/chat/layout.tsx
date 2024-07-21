"use client"
import { SessionProvider } from "next-auth/react";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    <SessionProvider>
      <section className="chat-layout">
        <main>{children}</main>
      </section>
    </SessionProvider>
  );
}