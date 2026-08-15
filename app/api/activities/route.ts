
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getActivities, getTodayStats, getMonthlyStats } from "@/lib/activity-logger";
import { getUserById } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";

export async function GET() {
  try {
    const session = await auth() as { user?: { id: string } } | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
    }

    // Tüm giriş yapmış kullanıcılar görebilsin diye izin kontrolünü kaldırdık
    const activities = getActivities(20);
    const stats = getTodayStats();
    const monthlyStats = getMonthlyStats();

    return NextResponse.json({ activities, stats, monthlyStats });
  } catch (e) {
    return NextResponse.json({ error: "Sunucu hatası: " + String(e) }, { status: 500 });
  }
}
