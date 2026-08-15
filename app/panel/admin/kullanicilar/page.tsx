import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import AdminUsersClient from "./client";

export const metadata: Metadata = createMetadata({
  title: "Kullanıcı Yönetimi",
  description: "Kullanıcı üyeliklerini ve rollerini yönet",
  path: "/panel/admin/kullanicilar",
  noIndex: true,
});

export default function AdminKullanicilarPage() {
  return <AdminUsersClient />;
}
