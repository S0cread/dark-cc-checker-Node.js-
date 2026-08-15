
import { NextResponse } from "next/server";
import { getActiveAnnouncements } from "@/lib/announcements";

export async function GET() {
  try {
    const announcements = getActiveAnnouncements();
    return NextResponse.json(announcements);
  } catch (e) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
