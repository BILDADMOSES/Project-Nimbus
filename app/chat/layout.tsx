"use client";
import React from 'react';
import { useSession } from 'next-auth/react';
import LanguageTranslator from '@/components/language/LanguageTranslator';


interface LayoutProps {
  children: React.ReactNode;
}

const LayoutContent: React.FC<LayoutProps> = ({ children }) => {
  const { data: session } = useSession();
  const preferredLanguage = session?.user?.preferredLanguage || 'en';

  return (
    <LanguageTranslator languageCode={preferredLanguage}>
      <section className="chat-layout">
        <main>
          {children}
        </main>
      </section>
    </LanguageTranslator>
  );
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
      <LayoutContent>{children}</LayoutContent>
  );
};

export default Layout;