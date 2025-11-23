"use client";

import React from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { Languages } from "lucide-react";

const LanguageSwitcher: React.FC = () => {
  const { language, toggleLanguage, isTranslating } = useTranslation();

  return (
    <button
      onClick={toggleLanguage}
      disabled={isTranslating}
      className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Toggle Language"
    >
      <Languages className="w-6 h-6" />
      <span className="font-semibold text-sm">
        {isTranslating ? (
          "Translating..."
        ) : (
          language === 'en' ? 'සිංහල' : 'English'
        )}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
