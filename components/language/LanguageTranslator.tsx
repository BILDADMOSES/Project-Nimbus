"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const Script = dynamic(() => import('next/script'), { ssr: false });

interface LanguageTranslatorProps {
  languageCode: string;
  children: React.ReactNode;
}

declare global {
  interface Window {
    gtranslateSettings: any;
    doGTranslate: (lang_pair: string) => void;
  }
}

const LanguageTranslator: React.FC<LanguageTranslatorProps> = ({ languageCode, children }) => {
  const [isTranslateReady, setIsTranslateReady] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.gtranslate.net/widgets/latest/float.js";
    script.async = true;
    script.onload = () => {
      window.gtranslateSettings = {
        "default_language": "en",
        "languages": ["en","es","fr","de","it","pt"],
        "wrapper_selector": ".g-translate-container",
        "switcher_horizontal_position": "hidden",
        "switcher_vertical_position": "hidden",
        "float_switcher_open_direction": "top"
      };
      const gtElem = document.createElement('div');
      gtElem.className = 'g-translate-container';
      gtElem.style.visibility = 'hidden';
      gtElem.style.position = 'absolute';
      document.body.appendChild(gtElem);
      setIsTranslateReady(true);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (isTranslateReady && languageCode !== 'en' && window.doGTranslate) {
      window.doGTranslate(`en|${languageCode}`);
    }
  }, [isTranslateReady, languageCode]);

  return (
    <>
      {children}
    </>
  );
};

export default LanguageTranslator;