import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/auth.config";
import { getTickets, getUserById } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }
    
    const dbUser = session.user.id ? getUserById(session.user.id) : null;
    const role = dbUser?.role ?? (session.user as Record<string, unknown>)?.role as string | undefined;
    
    if (role !== "super_admin" && role !== "mini_admin") {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }
    return NextResponse.json(getTickets());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
