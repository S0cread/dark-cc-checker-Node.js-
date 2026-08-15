import { Sidebar } from "@/components/dashboard/sidebar";
import { LanyardBar } from "@/components/dashboard/lanyard-bar";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/auth.config";
import { getUserById } from "@/lib/db";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authConfig);
  if (!session?.user) redirect("/login");

  // Always read fresh from DB so balance/permissions never come from stale JWT
  const dbUser = session.user.id ? getUserById(session.user.id) : null;

  const sessionUser = {
    name: dbUser?.name ?? session.user.name,
    email: dbUser?.email ?? session.user.email,
    role: dbUser?.role ?? (session.user as Record<string, unknown>).role as string ?? "user",
    membership: dbUser?.membership ?? "free",
    balance: dbUser?.balance ?? 0,
    permissions: dbUser?.permissions ?? "none",
    avatar: dbUser?.avatar ?? null,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={sessionUser} />
      <main className="ml-60 flex-1 min-h-screen overflow-y-auto">
        <LanyardBar />
        {children}
      </main>
    </div>
  );
}
