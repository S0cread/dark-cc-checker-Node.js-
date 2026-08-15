import { getServerSession } from "next-auth/next";
import { authConfig } from "@/auth.config";
import { getUserById } from "@/lib/db";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authConfig);
  if (!session?.user) {
    redirect("/panel");
  }
  
  // Read from DB to get fresh role data
  const dbUser = session.user.id ? getUserById(session.user.id) : null;
  const role = dbUser?.role ?? (session.user as Record<string, unknown>)?.role as string | undefined;
  
  if (role !== "super_admin" && role !== "mini_admin") {
    redirect("/panel");
  }
  
  return <>{children}</>;
}
