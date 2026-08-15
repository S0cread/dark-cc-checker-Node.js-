import { auth } from "@/auth";
import { getUserById } from "@/lib/db";
import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { ProfilimClient } from "./client";

export const metadata: Metadata = createMetadata({
  title: "Profilim",
  description: "Hesap bilgilerinizi yönetin.",
  path: "/panel/profilim",
  noIndex: true,
});

export default async function ProfilimPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const dbUser = userId ? getUserById(userId) : null;

  return (
    <ProfilimClient
      name={dbUser?.name ?? session?.user?.name ?? ""}
      email={dbUser?.email ?? session?.user?.email ?? ""}
      permissions={dbUser?.permissions ?? "none"}
      balance={dbUser?.balance ?? 0}
      role={dbUser?.role ?? "user"}
      avatar={dbUser?.avatar ?? null}
    />
  );
}
