import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { addPayment } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  }

  const body = await req.json();
  const { plan, crypto, txHash } = body as { plan?: string; crypto?: string; txHash?: string };

  if (!plan || !crypto || !txHash?.trim()) {
    return NextResponse.json({ error: "Eksik alanlar." }, { status: 400 });
  }

  const user = session.user as { id: string; name?: string | null; email?: string | null };

  addPayment({
    id: randomUUID(),
    userId: user.id,
    userName: user.name ?? "Bilinmiyor",
    userEmail: user.email ?? "",
    crypto,
    address: "",
    amount: 0,
    txHash: txHash.trim(),
    status: "pending",
    plan,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
