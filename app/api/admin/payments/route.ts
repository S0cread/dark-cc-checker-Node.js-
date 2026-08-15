import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/auth.config";
import { getPayments, updatePayment, updateUser, type UserPermissions, getUserById } from "@/lib/db";

async function getFreshRole() {
  const session = await getServerSession(authConfig);
  if (!session?.user) return null;
  
  const dbUser = session.user.id ? getUserById(session.user.id) : null;
  const role = dbUser?.role ?? (session.user as Record<string, unknown>)?.role as string | undefined;
  return role;
}

function isAdmin(role?: string | null) {
  return role === "super_admin" || role === "mini_admin";
}

const PLAN_TO_PERMISSIONS: Record<string, UserPermissions> = {
  sorgu: "sorgu",
  checker: "checker",
  full: "full",
};

export async function GET() {
  const session = await getServerSession(authConfig);
  const role = await getFreshRole();
  if (!session?.user?.id || !isAdmin(role)) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }
  const payments = getPayments();
  return NextResponse.json(payments);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authConfig);
  const role = await getFreshRole();
  if (!session?.user?.id || !isAdmin(role)) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const body = await req.json();
  const { id, status } = body as { id?: string; status?: string; membership?: string };

  if (!id || !status) {
    return NextResponse.json({ error: "Eksik alanlar." }, { status: 400 });
  }

  const updated = updatePayment(id, {
    status: status as "pending" | "approved" | "rejected",
    updatedAt: new Date().toISOString(),
  });
  if (!updated) return NextResponse.json({ error: "Ödeme bulunamadı." }, { status: 404 });

  if (status === "approved" && updated.userId) {
    const plan = updated.plan ?? "";
    const permissions = PLAN_TO_PERMISSIONS[plan];
    if (permissions) {
      updateUser(updated.userId, { permissions });
    }
  }

  return NextResponse.json({ success: true, payment: updated });
}
