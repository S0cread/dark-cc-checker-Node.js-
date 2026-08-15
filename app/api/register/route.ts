import { NextResponse } from "next/server";
import { getUsers, saveUsers, type DbUser } from "@/lib/db";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { logActivity } from "@/lib/activity-logger";

export async function POST(req: Request) {
  const body = await req.json() as { name?: string; email?: string; password?: string };
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır." }, { status: 400 });
  }

  const users = getUsers();

  const emailExists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (emailExists) {
    return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı." }, { status: 409 });
  }

  const nameExists = users.some((u) => u.name.toLowerCase() === name.toLowerCase());
  if (nameExists) {
    return NextResponse.json({ error: "Bu kullanıcı adı zaten alınmış." }, { status: 409 });
  }

  const hashedPassword = await hash(password, 10);

  const newUser: DbUser = {
    id: randomUUID(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role: "user",
    balance: 0,
    membership: "free",
    permissions: "none",
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  // Log the new user registration
  logActivity("user_register", `Yeni kullanıcı kaydı: ${name}`, newUser.id);

  return NextResponse.json({ success: true }, { status: 201 });
}
