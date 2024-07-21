"use client";
import React, { useState, useEffect } from 'react';

interface TranslatorProps {
  children: React.ReactNode;
  targetLanguage: string;
}

const Translator: React.FC<TranslatorProps> = ({ children, targetLanguage }) => {
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);

  useEffect(() => {
    const translateText = async (text: string) => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY;
      const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            target: targetLanguage,
          }),
        });

        const data = await response.json();
        return data.data.translations[0].translatedText;
      } catch (error) {
        console.error('Translation error:', error);
        return text;
      }
    };

    const translateContent = async () => {
      if (typeof children === 'string') {
        const translated = await translateText(children);
        setTranslatedContent(translated);
      }
    };

    if (targetLanguage !== 'en') {
      translateContent();
    }
  }, [children, targetLanguage]);

  if (targetLanguage === 'en' || typeof children !== 'string') {
    return <>{children}</>;
  }

  return <>{translatedContent || children}</>;
};

export default Translator;