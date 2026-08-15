
import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { JsonParserClient } from "./client";

export const metadata: Metadata = createMetadata({
  title: "JSON Parser",
  description: "JSON dosyalarından kartları çıkarın ve formatlayın.",
  path: "/panel/checker/json-parser",
  noIndex: true,
});

export default function JsonParserPage() {
  return <JsonParserClient />;
}

