"use client";
import React, { useEffect } from 'react';

interface LanguageTranslatorProps {
  languageCode: string;
  children: React.ReactNode;
}

declare global {
  interface Window {
    doGTranslate: (lang_pair: string) => void;
  }
}

const LanguageTranslator: React.FC<LanguageTranslatorProps> = ({ languageCode, children }) => {
  useEffect(() => {
    if (languageCode !== 'en' && window.doGTranslate) {
      window.doGTranslate(`en|${languageCode}`);
    }
  }, [languageCode]);

  return <>{children}</>;
};

export default LanguageTranslator;