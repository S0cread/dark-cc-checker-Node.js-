import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = createMetadata({
  title: "Kayıt Ol",
  description:
    "darkcheck.co ücretsiz hesap oluşturun. Checker çözümlerine hemen başlayın.",
  path: "/kayit",
});

export default function KayitLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return children;
}
