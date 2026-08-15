import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { getUsers } from "@/lib/db";
import { KullaniciSiralamasiClient } from "./client";

export const metadata: Metadata = createMetadata({
  title: "Kullanıcı Sıralaması",
  description: "Kullanıcı sıralaması listesi.",
  path: "/panel/kullanici-siralamasi",
  noIndex: true,
});

export default function KullaniciSiralamasiPage() {
  const users = getUsers()
    .map(({ id, name, membership, createdAt }) => ({ id, name, membership, createdAt }))
    .sort((a, b) => {
      const order = { enterprise: 4, team: 3, pro: 2, free: 1 };
      return (order[b.membership as keyof typeof order] ?? 0) - (order[a.membership as keyof typeof order] ?? 0);
    });

  return <KullaniciSiralamasiClient users={users} />;
}
