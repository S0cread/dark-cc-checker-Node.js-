import { auth } from "@/auth";
import { getUserById } from "@/lib/db";
import { redirect } from "next/navigation";

export type UserPermissions = "none" | "checker" | "full";

async function getDbPermissions(): Promise<{ role: string; permissions: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { role: "user", permissions: "none" };
  const user = getUserById(userId);
  return { role: user?.role ?? "user", permissions: user?.permissions ?? "none" };
}

export function isAdmin(role?: string) {
  return role === "super_admin" || role === "mini_admin";
}

export function hasCheckerAccess(role?: string, permissions?: string) {
  if (isAdmin(role)) return true;
  return permissions === "checker";
}

export async function requireCheckerAccess() {
  const { role, permissions } = await getDbPermissions();
  if (!hasCheckerAccess(role, permissions)) {
    redirect("/panel?erişim=checker");
  }
}
