import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/auth.config";
import { getMarketCards, saveMarketCards, type MarketCard, getUserById } from "@/lib/db";
import { randomUUID } from "crypto";

async function getFreshRole(): Promise<string | null> {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) return null;
    
    const dbUser = session.user.id ? getUserById(session.user.id) : null;
    const role = dbUser?.role ?? (session.user as Record<string, unknown>)?.role as string | undefined;
    return role ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const role = await getFreshRole();
    if (role !== "super_admin" && role !== "mini_admin") {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }
    return NextResponse.json(getMarketCards());
  } catch (e) {
    console.error("GET /api/admin/market error:", e);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const role = await getFreshRole();
    if (role !== "super_admin" && role !== "mini_admin") {
      return NextResponse.json({ error: "Yetkisiz. Rol: " + String(role) }, { status: 403 });
    }
    const body = await req.json() as Omit<MarketCard, "id" | "sold">;
    const newCard: MarketCard = { ...body, id: randomUUID(), sold: false };
    const cards = getMarketCards();
    cards.push(newCard);
    saveMarketCards(cards);
    return NextResponse.json({ success: true, card: newCard }, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/market error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const role = await getFreshRole();
    if (role !== "super_admin" && role !== "mini_admin") {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }
    const { id } = await req.json() as { id?: string };
    if (!id) return NextResponse.json({ error: "ID gerekli." }, { status: 400 });
    const cards = getMarketCards().filter((c) => c.id !== id);
    saveMarketCards(cards);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/admin/market error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
