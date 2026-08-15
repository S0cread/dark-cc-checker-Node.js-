import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/auth.config";
import { getUserById } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = createMetadata({
  title: "Admin Paneli",
  description: "Yönetim paneli",
  path: "/panel/admin",
  noIndex: true,
});

export default async function AdminPage() {
  const session = await getServerSession(authConfig);
  if (!session?.user) redirect("/panel");
  
  const dbUser = session.user.id ? getUserById(session.user.id) : null;
  const role = dbUser?.role ?? (session.user as Record<string, unknown>)?.role as string;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Admin Paneli</h1>
        <p className="mt-1 text-muted-foreground">
          Rol: <span className="text-accent font-medium">{role === "super_admin" ? "Süper Admin" : "Mini Admin"}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <Link
          href="/panel/admin/duyurular"
          className="group rounded-2xl border border-border bg-card p-6 hover:border-accent/50 transition-colors duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m8 6-4 4 4 4M4 10h16m-4 4 4-4-4-4M20 14H4" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1">Duyurular</h2>
          <p className="text-sm text-muted-foreground">Kullanıcılara duyuru yayınla.</p>
        </Link>

        <Link
          href="/panel/admin/odemeler"
          className="group rounded-2xl border border-border bg-card p-6 hover:border-accent/50 transition-colors duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08.402-2.599-1" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1">Ödeme Talepleri</h2>
          <p className="text-sm text-muted-foreground">Bekleyen kripto ödemeleri görüntüle ve onayla.</p>
        </Link>

        {role === "super_admin" && (
          <Link
            href="/panel/admin/kullanicilar"
            className="group rounded-2xl border border-border bg-card p-6 hover:border-accent/50 transition-colors duration-200"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">Kullanıcı Yönetimi</h2>
            <p className="text-sm text-muted-foreground">Üyelikleri ve rolleri yönet.</p>
          </Link>
        )}
      </div>
    </div>
  );
}