"use client";

import { motion } from "motion/react";
import { CrownIcon, TrophyIcon, UserIcon } from "@/components/icons";

const MEMBERSHIP_LABEL: Record<string, string> = {
  enterprise: "Enterprise",
  team: "Team",
  pro: "Pro",
  free: "Ücretsiz",
};

const MEMBERSHIP_COLOR: Record<string, string> = {
  enterprise: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  team: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  pro: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  free: "text-muted-foreground bg-muted/30 border-border",
};

interface UserRow {
  id: string;
  name: string;
  membership: string;
  createdAt: string;
}

export function KullaniciSiralamasiClient({ users }: { users: UserRow[] }) {
  return (
    <div className="p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <TrophyIcon className="h-7 w-7 text-accent" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kullanıcı Sıralaması</h1>
            <p className="text-sm text-muted-foreground">Üyelik seviyesine göre sıralanmış kullanıcılar</p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-2">
        {users.map((user, i) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
              {i === 0 ? <CrownIcon className="h-4 w-4 text-yellow-400" /> : i + 1}
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString("tr-TR")} tarihinden beri üye
              </p>
            </div>
            <span className={`shrink-0 rounded-full border px-3 py-0.5 text-xs font-medium ${MEMBERSHIP_COLOR[user.membership] ?? MEMBERSHIP_COLOR.free}`}>
              {MEMBERSHIP_LABEL[user.membership] ?? user.membership}
            </span>
          </motion.div>
        ))}
        {users.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
            <UserIcon className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p>Henüz kullanıcı yok.</p>
          </div>
        )}
      </div>
    </div>
  );
}
