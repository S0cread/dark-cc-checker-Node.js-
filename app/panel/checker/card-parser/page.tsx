
import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { CardParserClient } from "./client";

export const metadata: Metadata = createMetadata({
  title: "Card Parser",
  description: "Kredi kartı verilerini parse edin ve formatlayın.",
  path: "/panel/checker/card-parser",
  noIndex: true,
});

export default function CardParserPage() {
  return <CardParserClient />;
}

