import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getMarketCards, saveMarketCards, getUserById, updateUser,
  getPurchases, savePurchases, type Purchase
} from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { cardId } = await req.json() as { cardId?: string };
  if (!cardId) return NextResponse.json({ error: "Kart ID gerekli." }, { status: 400 });

  const user = getUserById(session.user.id);
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

  const cards = getMarketCards();
  const cardIdx = cards.findIndex((c) => c.id === cardId);
  if (cardIdx === -1) return NextResponse.json({ error: "Kart bulunamadı." }, { status: 404 });

  const card = cards[cardIdx]!;
  if (card.sold) return NextResponse.json({ error: "Bu kart zaten satılmış." }, { status: 409 });
  if (user.balance < card.price) return NextResponse.json({ error: "Yetersiz bakiye." }, { status: 402 });

  // Deduct balance
  updateUser(user.id, { balance: user.balance - card.price });

  // Generate demo card details (real ones would come from your backend/API)
  const cardNumber = card.cardNumber ?? `${card.bin}${String(Math.floor(Math.random() * 9999999999)).padStart(10, "0")}`;
  const cvv = card.cvv ?? String(Math.floor(Math.random() * 900) + 100);

  // Mark as sold
  cards[cardIdx] = { ...card, sold: true, cardNumber, cvv };
  saveMarketCards(cards);

  // Record purchase
  const purchase: Purchase = {
    id: randomUUID(),
    userId: user.id,
    cardId: card.id,
    cardNumber,
    cvv,
    month: card.month,
    year: card.year,
    bin: card.bin,
    bank: card.bank,
    cardHolder: card.cardHolder,
    pricePaid: card.price,
    checkStatus: "unchecked",
    createdAt: new Date().toISOString(),
  };

  const purchases = getPurchases();
  purchases.push(purchase);
  savePurchases(purchases);

  return NextResponse.json({ success: true, purchaseId: purchase.id });
}
