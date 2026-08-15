import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { getUserById } from "@/lib/db";
import BakiyeYukleClient from "./client";

export const metadata: Metadata = createMetadata({
  title: "Bakiye Yükle",
  description: "Bakiyenizle plan satın alın veya kripto ile bakiye yükleyin.",
  path: "/panel/bakiye-yukle",
  noIndex: true,
});

export default async function BakiyeYuklePage() {
  const session = await auth();
  const userId = session?.user?.id;

  // Always read fresh from DB so balance is never stale after a purchase
  const dbUser = userId ? getUserById(userId) : null;

  return (
    <BakiyeYukleClient
      initialBalance={dbUser?.balance ?? 0}
      initialPermissions={dbUser?.permissions ?? "none"}
    />
  );
}
