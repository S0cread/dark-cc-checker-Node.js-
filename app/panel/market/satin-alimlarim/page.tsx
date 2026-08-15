import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { SatinAlimlarimClient } from "./client";

export const metadata: Metadata = createMetadata({
  title: "Satın Alımlarım",
  description: "Market satın alımlarınız.",
  path: "/panel/market/satin-alimlarim",
  noIndex: true,
});

export default function SatinAlimlarimPage() {
  return <SatinAlimlarimClient />;
}
