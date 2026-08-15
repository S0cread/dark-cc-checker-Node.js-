import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import type { ReactNode } from "react";

export const metadata: Metadata = createMetadata({
  title: "Giriş Yap",
  description:
    "darkcheck.co hesabınıza giriş yapın. Checker çözümlerine erişin.",
  path: "/login",
});

export default function LoginLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Yükleniyor…</div>}>
      {children}
    </Suspense>
  );
}
