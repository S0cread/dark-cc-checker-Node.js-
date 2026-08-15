import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/auth.config";
import { getUserById } from "@/lib/db";
import fs from "fs";
import path from "path";

function getApiKeysPath() { return path.join(process.cwd(), "data", "api-keys.json"); }

function readKeys(): Record<string, string> {
  return JSON.parse(fs.readFileSync(getApiKeysPath(), "utf-8")) as Record<string, string>;
}

function writeKeys(data: Record<string, string>) {
  fs.writeFileSync(getApiKeysPath(), JSON.stringify(data, null, 2), "utf-8");
}

async function getFreshRole() {
  const session = await getServerSession(authConfig);
  if (!session?.user) return null;
  
  const dbUser = session.user.id ? getUserById(session.user.id) : null;
  const role = dbUser?.role ?? (session.user as Record<string, unknown>)?.role as string | undefined;
  return role;
}

export async function GET() {
  const role = await getFreshRole();
  if (role !== "super_admin") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }
  return NextResponse.json(readKeys());
}

export async function POST(req: Request) {
  const role = await getFreshRole();
  if (role !== "super_admin") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }
  const body = await req.json() as Record<string, string>;
  const current = readKeys();
  const updated = { ...current, ...body };
  writeKeys(updated);
  return NextResponse.json({ success: true });
}
