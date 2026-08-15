import { NextResponse } from "next/server";
import { getMarketCards } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const cards = getMarketCards().map(({ cardNumber: _cn, cvv: _cv, ...c }) => c);
  return NextResponse.json(cards);
}
