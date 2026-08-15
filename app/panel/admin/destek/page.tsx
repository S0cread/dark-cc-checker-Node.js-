import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { AdminDestekClient } from "./client";

export const metadata: Metadata = createMetadata({
  title: "Destek Yönetimi",
  description: "Destek taleplerini yönetin.",
  path: "/panel/admin/destek",
  noIndex: true,
});

export default function AdminDestekPage() {
  return <AdminDestekClient />;
}
