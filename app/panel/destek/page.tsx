import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { DestekClient } from "./client";

export const metadata: Metadata = createMetadata({
  title: "Destek Sistemi",
  description: "Destek talebi oluşturun ve mevcut taleplerinizi takip edin.",
  path: "/panel/destek",
  noIndex: true,
});

export default function DestekPage() {
  return <DestekClient />;
}
