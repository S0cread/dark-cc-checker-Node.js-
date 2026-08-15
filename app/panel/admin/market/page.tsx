import { getServerSession } from "next-auth/next";
import { authConfig } from "@/auth.config";
import { getUserById } from "@/lib/db";
import { redirect } from "next/navigation";
import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { AdminMarketClient } from "./client";

export const metadata: Metadata = createMetadata({
  title: "Market Yönetimi",
  description: "Markete kart ekle, sil ve yönet.",
  path: "/panel/admin/market",
  noIndex: true,
});

export default async function AdminMarketPage() {
  const session = await getServerSession(authConfig);
  if (!session?.user) redirect("/panel");
  
  const dbUser = session.user.id ? getUserById(session.user.id) : null;
  const role = dbUser?.role ?? (session.user as Record<string, unknown>)?.role as string | undefined;
  
  if (role !== "super_admin" && role !== "mini_admin") redirect("/panel");
  
  return <AdminMarketClient />;
}
