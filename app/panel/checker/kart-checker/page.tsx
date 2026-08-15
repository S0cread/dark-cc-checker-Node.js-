import { getServerSession } from "next-auth/next";
import { authConfig } from "@/auth.config";
import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { KartCheckerClient } from "./client";
import { getUserById } from "@/lib/db";
import { getUsageInfo } from "@/lib/checker-usage";

export const metadata: Metadata = createMetadata({
  title: "Kart Checker",
  description: "Kredi kartı doğrulama sistemi.",
  path: "/panel/checker/kart-checker",
  noIndex: true,
});

export default async function KartCheckerPage() {
  const session = await getServerSession(authConfig);
  const userId = session?.user?.id;
  const dbUser = userId ? getUserById(userId) : null;
  const perms = dbUser?.permissions ?? "none";
  const role = dbUser?.role ?? "user";

  const isFree = role !== "super_admin" && role !== "mini_admin" && perms !== "checker" && perms !== "full";
  const usage = isFree ? getUsageInfo(userId ?? "") : null;

  return (
    <KartCheckerClient
      isFree={isFree}
      dailyUsed={usage?.count ?? 0}
      dailyLimit={usage?.limit ?? 5}
    />
  );
}
