import { auth } from "@/auth";
import { getPurchases } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { PurchaseDetailClient } from "./client";

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId: purchaseId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const purchases = getPurchases();
  const purchase = purchases.find((p) => p.id === purchaseId);
  if (!purchase || purchase.userId !== session.user.id) notFound();

  return <PurchaseDetailClient purchase={purchase} />;
}
