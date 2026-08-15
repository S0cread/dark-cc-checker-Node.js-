import { GlobalBackground } from "@/components/GlobalBackground";
import { ConsoleEgg } from "@/components/ConsoleEgg";
import { Providers } from "@/components/providers";
import { SkipToContent } from "@/components/skip-to-content";
import { baseMetadata } from "@/lib/metadata";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = baseMetadata;

export const viewport: Viewport = {
  themeColor: "#0c0c0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactNode {
  return (
    <html lang="tr" suppressHydrationWarning className="dark">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>
          <GlobalBackground />
          <ConsoleEgg />
          <div className="relative z-10">
            <SkipToContent />
            {children}
          </div>
          <div className="fixed bottom-4 right-4 z-50 pointer-events-none select-none">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/5 backdrop-blur-sm px-3 py-1.5 text-[10px] font-medium text-white/30 tracking-wider">
              <svg className="h-2.5 w-2.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              dev by SocRead
            </span>
          </div>
        </Providers>
      </body>
    </html>
  );
}
