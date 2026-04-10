"use client";

import NextTopLoader from "nextjs-toploader";
import { theme } from "@/styles/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextTopLoader
        color={theme.colors.accentBlue}
        height={3}
        shadow="0 0 12px rgba(var(--blue-rgb), 0.35)"
        speed={250}
        showSpinner={false}
      />
      {children}
    </>
  );
}
