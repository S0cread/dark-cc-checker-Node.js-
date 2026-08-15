import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import AdminPaymentsClient from "./client";

export const metadata: Metadata = createMetadata({
  title: "Ödeme Talepleri",
  description: "Bekleyen kripto ödemeleri",
  path: "/panel/admin/odemeler",
  noIndex: true,
});

export default function AdminOdemelerPage() {
  return <AdminPaymentsClient />;
}
