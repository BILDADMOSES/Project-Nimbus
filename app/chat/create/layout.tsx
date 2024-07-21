"use client"
import React, { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

interface TranslateLayoutProps {
  children: React.ReactNode;
}

declare global {
  interface Window {
    gtranslateSettings: any;
    doGTranslate: (lang_pair: string) => void;
  }
}

const TranslateLayout: React.FC<TranslateLayoutProps> = ({ children }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const preferredLanguage = session?.user?.preferredLanguage || 'en';
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeTranslation = () => {
      if (window.doGTranslate && preferredLanguage !== 'en') {
        window.doGTranslate(`en|${preferredLanguage}`);
      }
    };

    console.log('preferredLanguage', preferredLanguage);
    // Wait for the script to load before initializing
    const timer = setTimeout(initializeTranslation, 1000);

    return () => clearTimeout(timer);
    
  }, [preferredLanguage]);

  return (
    <>
      <Script id="gtranslate-settings" strategy="beforeInteractive">
        {`
          window.gtranslateSettings = {
            "default_language": "en",
            "languages": ["en","es","fr","de","it","pt"],
            "detect_browser_language": false,
            "wrapper_selector": ".gtranslate_wrapper",
            "alt_flags": {"en": "usa"},
            "flags_style": "custom",
            "auto_translate": true
          };
        `}
      </Script>
      <Script 
        src="https://cdn.gtranslate.net/widgets/latest/dwf.js" 
        strategy="afterInteractive"
      />
      <div ref={contentRef}>
        {children}
      </div>
    </>
  );
};

export default TranslateLayout;