import { TranslationProvider } from "@/contexts/TranslationContext";
import { ReactNode } from "react";

export default function ParentLayout({ children }: { children: ReactNode }) {
  return <TranslationProvider>{children}</TranslationProvider>;
}
