import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserById, updateUser, type UserPermissions } from "@/lib/db";

const PERMISSION_PLANS: Record<string, { permissions: UserPermissions; price: number }> = {
  sorgu: { permissions: "sorgu", price: 25 },
  checker: { permissions: "checker", price: 30 },
  full: { permissions: "full", price: 45 },
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  }

  const body = await req.json() as { planId?: string };
  const { planId } = body;

  if (!planId || !PERMISSION_PLANS[planId]) {
    return NextResponse.json({ error: "Geçersiz plan." }, { status: 400 });
  }

  const plan = PERMISSION_PLANS[planId]!;
  const user = getUserById(session.user.id);
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

  if (user.balance < plan.price) {
    return NextResponse.json({ error: "Yetersiz bakiye." }, { status: 402 });
  }

  updateUser(user.id, {
    balance: user.balance - plan.price,
    permissions: plan.permissions,
  });

  return NextResponse.json({ success: true, permissions: plan.permissions, newBalance: user.balance - plan.price });
}
