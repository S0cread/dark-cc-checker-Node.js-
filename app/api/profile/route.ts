import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserById, updateUser, getUsers } from "@/lib/db";
import { compare, hash } from "bcryptjs";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Oturum açılmamış." }, { status: 401 });
  }

  const body = await req.json() as {
    name?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  const user = getUserById(session.user.id);
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

  const updateData: { name?: string; password?: string } = {};

  if (body.name && body.name.trim() !== user.name) {
    const taken = getUsers().some(
      (u) => u.id !== user.id && u.name.toLowerCase() === body.name!.toLowerCase()
    );
    if (taken) return NextResponse.json({ error: "Bu kullanıcı adı zaten alınmış." }, { status: 409 });
    updateData.name = body.name.trim();
  }

  if (body.newPassword) {
    if (!body.currentPassword) {
      return NextResponse.json({ error: "Mevcut şifrenizi giriniz." }, { status: 400 });
    }
    const valid = await compare(body.currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: "Mevcut şifre hatalı." }, { status: 400 });
    if (body.newPassword.length < 6) {
      return NextResponse.json({ error: "Yeni şifre en az 6 karakter olmalı." }, { status: 400 });
    }
    updateData.password = await hash(body.newPassword, 10);
  }

  if (!Object.keys(updateData).length) {
    return NextResponse.json({ error: "Değiştirilecek bir alan bulunamadı." }, { status: 400 });
  }

  const updated = updateUser(session.user.id, updateData);
  return NextResponse.json({ success: true, name: updated?.name });
}
