import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { MarketClient } from "./client";

export const metadata: Metadata = createMetadata({
  title: "Market",
  description: "Kart marketi - güvenli satın alma.",
  path: "/panel/market",
  noIndex: true,
});

export default function MarketPage() {
  return <MarketClient />;
}
