"use client";

import { useEffect, useState } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';

export function useTranslatedText(originalText: string): string {
  const { language, translateText } = useTranslation();
  const [translatedText, setTranslatedText] = useState(originalText);

  useEffect(() => {
    let isMounted = true;

    const performTranslation = async () => {
      if (language === 'en') {
        setTranslatedText(originalText);
      } else {
        const translated = await translateText(originalText);
        if (isMounted) {
          setTranslatedText(translated);
        }
      }
    };

    performTranslation();

    return () => {
      isMounted = false;
    };
  }, [originalText, language, translateText]);

  return translatedText;
}
