import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/auth.config";
import { getUsers, saveUsers, updateUser, getUserById, type Membership, type UserRole, type UserPermissions } from "@/lib/db";

async function getFreshRole() {
  const session = await getServerSession(authConfig);
  if (!session?.user) return null;
  
  const dbUser = session.user.id ? getUserById(session.user.id) : null;
  const role = dbUser?.role ?? (session.user as Record<string, unknown>)?.role as string | undefined;
  return role;
}

export async function GET() {
  const session = await getServerSession(authConfig);
  const role = await getFreshRole();
  if (!session?.user?.id || (role !== "super_admin" && role !== "mini_admin")) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }
  const users = getUsers().map(({ password: _pw, ...u }) => u);
  return NextResponse.json(users);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authConfig);
  const role = await getFreshRole();
  if (!session?.user?.id || role !== "super_admin") {
    return NextResponse.json({ error: "Sadece süper admin bu işlemi yapabilir." }, { status: 403 });
  }

  const body = await req.json() as {
    id?: string;
    membership?: string;
    userRole?: string;
    balance?: number;
    balanceOp?: "set" | "add" | "subtract";
    permissions?: string;
  };
  const { id, membership, userRole, balance, balanceOp, permissions } = body;

  if (!id) return NextResponse.json({ error: "Kullanıcı ID gerekli." }, { status: 400 });

  const updateData: { membership?: Membership; role?: UserRole; balance?: number; permissions?: UserPermissions } = {};
  if (membership) updateData.membership = membership as Membership;
  if (userRole) updateData.role = userRole as UserRole;
  if (permissions !== undefined) updateData.permissions = permissions as UserPermissions;

  if (balance !== undefined) {
    if (balanceOp === "add" || balanceOp === "subtract") {
      const current = getUserById(id);
      if (!current) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
      updateData.balance = balanceOp === "add"
        ? current.balance + balance
        : Math.max(0, current.balance - balance);
    } else {
      updateData.balance = Math.max(0, balance);
    }
  }

  const updated = updateUser(id, updateData);
  if (!updated) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

  const { password: _pw, ...safeUser } = updated;
  return NextResponse.json({ success: true, user: safeUser });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authConfig);
  const role = await getFreshRole();
  if (!session?.user?.id || role !== "super_admin") {
    return NextResponse.json({ error: "Sadece süper admin silebilir." }, { status: 403 });
  }
  const { id } = await req.json() as { id?: string };
  if (!id) return NextResponse.json({ error: "ID gerekli." }, { status: 400 });

  const users = getUsers().filter((u) => u.id !== id);
  saveUsers(users);
  return NextResponse.json({ success: true });
}
