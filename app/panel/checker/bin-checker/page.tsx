import { getServerSession } from "next-auth/next";
import { authConfig } from "@/auth.config";
import { redirect } from "next/navigation";
import { createMetadata } from "@/lib/metadata";
import { getUserById } from "@/lib/db";
import type { Metadata } from "next";
import { BinCheckerClient } from "./client";

export const metadata: Metadata = createMetadata({
  title: "BIN Checker",
  description: "Banka kimlik numarası (BIN) sorgulama. Sadece ücretli üyelere özel.",
  path: "/panel/checker/bin-checker",
  noIndex: true,
});

export default async function BinCheckerPage() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const dbUser = getUserById(session.user.id);
  const membership = dbUser?.membership ?? "free";
  const role = dbUser?.role ?? "user";
  const permissions = dbUser?.permissions ?? "none";
  
  const isAllowed = role === "super_admin" || role === "mini_admin" || membership !== "free" || permissions === "full";
  if (!isAllowed) {
    redirect("/panel/bakiye-yukle");
  }
  
  return <BinCheckerClient />;
}
