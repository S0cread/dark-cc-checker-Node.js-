"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WalletIcon, XIcon, UserIcon, ShieldIcon } from "@/components/icons";

interface DbUserSafe {
  id: string;
  name: string;
  email: string;
  role: string;
  balance: number;
  membership: string;
  permissions: string;
  createdAt: string;
}

const MEMBERSHIPS = ["free", "pro", "team", "enterprise"];
const ROLES = ["user", "mini_admin", "super_admin"];
const PERMISSIONS = ["none", "checker"];

const MEMBERSHIP_LABELS: Record<string, string> = {
  free: "Ücretsiz", pro: "Pro", team: "Team", enterprise: "Enterprise",
};
const ROLE_LABELS: Record<string, string> = {
  user: "Kullanıcı", mini_admin: "Mini Admin", super_admin: "Süper Admin",
};
const PERM_LABELS: Record<string, string> = {
  none: "Erişim Yok",
  checker: "Checker",
};
const PERM_COLORS: Record<string, string> = {
  none: "text-muted-foreground border-border bg-muted/20",
  checker: "text-violet-400 border-violet-500/25 bg-violet-500/8",
};

interface BalanceModalProps {
  user: DbUserSafe;
  onClose: () => void;
  onSave: (userId: string, amount: number, op: "set" | "add" | "subtract") => Promise<void>;
}

function BalanceModal({ user, onClose, onSave }: BalanceModalProps) {
  const [amount, setAmount] = useState("");
  const [op, setOp] = useState<"set" | "add" | "subtract">("set");
  const [saving, setSaving] = useState(false);

  async function handle() {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) return;
    setSaving(true);
    await onSave(user.id, num, op);
    setSaving(false);
    onClose();
  }

  const preview = () => {
    const num = parseFloat(amount) || 0;
    if (op === "set") return num;
    if (op === "add") return user.balance + num;
    return Math.max(0, user.balance - num);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm mx-4 rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <WalletIcon className="h-4 w-4 text-accent" /> Bakiye Yönet
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{user.name} — Mevcut: {user.balance} €</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-1.5">
            {(["set", "add", "subtract"] as const).map((o) => (
              <button key={o} onClick={() => setOp(o)}
                className={`rounded-lg border py-2 text-xs font-medium transition-colors ${op === o ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-accent/40"}`}>
                {o === "set" ? "Ayarla" : o === "add" ? "Ekle" : "Çıkar"}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Miktar (€)</label>
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
              className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </div>
          {amount && (
            <div className="rounded-lg bg-muted/30 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Yeni bakiye: </span>
              <span className="font-semibold text-foreground">{preview()} €</span>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">İptal</button>
            <button onClick={handle} disabled={saving || !amount}
              className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? "Kaydediliyor…" : "Uygula"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminUsersClient() {
  const [users, setUsers] = useState<DbUserSafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [changes, setChanges] = useState<Record<string, { membership?: string; role?: string; permissions?: string }>>({});
  const [balanceUser, setBalanceUser] = useState<DbUserSafe | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json() as DbUserSafe[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  function setChange(userId: string, key: "membership" | "role" | "permissions", value: string) {
    setChanges((prev) => ({ ...prev, [userId]: { ...prev[userId], [key]: value } }));
  }

  async function save(userId: string) {
    const change = changes[userId];
    if (!change) return;
    setSaving(userId);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, membership: change.membership, userRole: change.role, permissions: change.permissions }),
    });
    setChanges((prev) => { const n = { ...prev }; delete n[userId]; return n; });
    await load();
    setSaving(null);
  }

  async function saveBalance(userId: string, amount: number, op: "set" | "add" | "subtract") {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, balance: amount, balanceOp: op }),
    });
    await load();
  }

  async function deleteUser(userId: string) {
    setDeleting(userId);
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId }),
    });
    setDeleting(null);
    setConfirmDelete(null);
    await load();
  }

  const filtered = users.filter((u) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-5">
      <AnimatePresence>
        {balanceUser && (
          <BalanceModal user={balanceUser} onClose={() => setBalanceUser(null)} onSave={saveBalance} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-accent" /> Kullanıcı Yönetimi
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Üyelik, rol, izin ve bakiye yönetimi</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim veya e-posta ara…"
            className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 w-56"
          />
          <span className="text-xs text-muted-foreground shrink-0">{filtered.length} kullanıcı</span>
        </div>
      </div>

      {/* Permission legend */}
      <div className="flex flex-wrap gap-2">
        {PERMISSIONS.map((p) => (
          <span key={p} className={`rounded-lg border px-3 py-1 text-[11px] font-semibold ${PERM_COLORS[p]}`}>
            {p === "none" ? "🚫" : "💳"} {PERM_LABELS[p]}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Yükleniyor…</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Kullanıcı</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">İzin</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Üyelik</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Bakiye</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const current = changes[u.id];
                const membership = current?.membership ?? u.membership;
                const role = current?.role ?? u.role;
                const permissions = current?.permissions ?? (u.permissions ?? "none");
                const hasChange = !!current;
                return (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground text-sm">{u.name}</div>
                      <div className="text-[11px] text-muted-foreground">{u.email}</div>
                    </td>

                    {/* Permissions */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${PERM_COLORS[permissions]}`}>
                          <ShieldIcon className="h-3 w-3 mr-1 opacity-70" />
                          {PERM_LABELS[permissions] ?? permissions}
                        </span>
                        <select
                          value={permissions}
                          onChange={(e) => setChange(u.id, "permissions", e.target.value)}
                          className="bg-muted/30 border border-border rounded-md px-1.5 py-1 text-foreground text-[11px] focus:outline-none focus:ring-1 focus:ring-accent"
                        >
                          {PERMISSIONS.map((p) => (
                            <option key={p} value={p}>{PERM_LABELS[p]}</option>
                          ))}
                        </select>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <select value={membership} onChange={(e) => setChange(u.id, "membership", e.target.value)}
                        className="bg-muted/30 border border-border rounded-lg px-2 py-1.5 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-accent">
                        {MEMBERSHIPS.map((m) => <option key={m} value={m}>{MEMBERSHIP_LABELS[m]}</option>)}
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      <select value={role} onChange={(e) => setChange(u.id, "role", e.target.value)}
                        className="bg-muted/30 border border-border rounded-lg px-2 py-1.5 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-accent">
                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      <button onClick={() => setBalanceUser(u)}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-xs text-foreground hover:border-accent/50 hover:bg-accent/5 transition-colors">
                        <WalletIcon className="h-3.5 w-3.5 text-accent" />
                        {u.balance} €
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => save(u.id)} disabled={!hasChange || saving === u.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${hasChange ? "bg-accent text-accent-foreground hover:opacity-90" : "bg-muted/20 text-muted-foreground/40 cursor-default"} disabled:opacity-50`}>
                          {saving === u.id ? "…" : "Kaydet"}
                        </button>
                        {confirmDelete === u.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => deleteUser(u.id)} disabled={deleting === u.id}
                              className="px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors">
                              {deleting === u.id ? "…" : "Evet"}
                            </button>
                            <button onClick={() => setConfirmDelete(null)}
                              className="px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground">
                              Hayır
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(u.id)}
                            className="px-2.5 py-1.5 rounded-lg border border-red-500/20 text-red-400/70 text-xs hover:border-red-500/40 hover:text-red-400 transition-colors">
                            Sil
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
