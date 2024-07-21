"use client";
import React from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import Translator from '@/components/language/LanguageTranslator'; 

interface LayoutProps {
  children: React.ReactNode;
}

const LayoutContent: React.FC<LayoutProps> = ({ children }) => {
  const { data: session } = useSession();
  const preferredLanguage = session?.user?.preferredLanguage || 'en';

  return (
    <Translator targetLanguage={preferredLanguage}>
      <section className="chat-layout">
        <main>
          {children}
        </main>
      </section>
    </Translator>
  );
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SessionProvider>
      <LayoutContent>{children}</LayoutContent>
    </SessionProvider>
  );
};

export default Layout;