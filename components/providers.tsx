"use client";

import { SmoothScroll } from "@/components/smooth-scroll";
import { ReducedMotionProvider } from "@/lib/motion";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { CustomCardCursor } from "@/components/CustomCardCursor";

export function Providers({ children }: { children: ReactNode }): ReactNode {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <ReducedMotionProvider>
          <SmoothScroll>
            <CustomCardCursor />
            {children}
          </SmoothScroll>
        </ReducedMotionProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
