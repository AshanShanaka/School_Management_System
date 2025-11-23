"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface TranslationContextType {
  language: 'en' | 'si';
  toggleLanguage: () => void;
  translateText: (text: string) => Promise<string>;
  isTranslating: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Cache for translated texts
const translationCache = new Map<string, Map<string, string>>();

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'si'>('en');
  const [isTranslating, setIsTranslating] = useState(false);

  // Load saved language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('parent-dashboard-lang') as 'en' | 'si';
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'si' : 'en';
    setLanguage(newLang);
    localStorage.setItem('parent-dashboard-lang', newLang);
  };

  const translateText = useCallback(async (text: string): Promise<string> => {
    // If English, return original
    if (language === 'en') {
      return text;
    }

    // Check cache first
    if (!translationCache.has(language)) {
      translationCache.set(language, new Map());
    }
    
    const langCache = translationCache.get(language)!;
    if (langCache.has(text)) {
      return langCache.get(text)!;
    }

    // Translate via API
    try {
      setIsTranslating(true);
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: language }),
      });

      if (!response.ok) {
        console.error('Translation failed:', response.statusText);
        return text;
      }

      const data = await response.json();
      const translatedText = data.translatedText || text;
      
      // Cache the result
      langCache.set(text, translatedText);
      
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    } finally {
      setIsTranslating(false);
    }
  }, [language]);

  return (
    <TranslationContext.Provider value={{ language, toggleLanguage, translateText, isTranslating }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
};
