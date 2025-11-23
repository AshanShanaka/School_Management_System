"use client";

import { useTranslatedText } from "@/hooks/useTranslatedText";
import { ReactNode } from "react";

interface TranslatedTextProps {
  children: string | ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export function TranslatedText({ children, as: Component = "span", className }: TranslatedTextProps) {
  const text = typeof children === 'string' ? children : String(children);
  const translatedText = useTranslatedText(text);
  
  return <Component className={className}>{translatedText}</Component>;
}
