import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPurchases } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const all = getPurchases();
  const mine = all.filter((p) => p.userId === session.user!.id);
  return NextResponse.json(mine);
}
