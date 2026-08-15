"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { WalletIcon, ShieldIcon, EyeIcon, EyeOffIcon, CameraIcon } from "@/components/icons";

const PERM_LABEL: Record<string, string> = {
  none: "Ücretsiz",
  checker: "Checker",
};

const PERM_COLOR: Record<string, string> = {
  none: "text-muted-foreground bg-muted/30 border-border",
  checker: "text-violet-400 bg-violet-400/10 border-violet-400/30",
};

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Süper Admin",
  mini_admin: "Mini Admin",
  user: "Kullanıcı",
};

interface Props {
  name: string;
  email: string;
  permissions: string;
  balance: number;
  role: string;
  avatar: string | null;
}

export function ProfilimClient({ name, email, permissions, balance, role, avatar: initialAvatar }: Props) {
  const [avatar, setAvatar] = useState<string | null>(initialAvatar);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    setAvatarLoading(true);

    const form = new FormData();
    form.append("avatar", file);

    const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
    const data = await res.json() as { avatar?: string; error?: string };

    if (!res.ok) { setAvatarError(data.error ?? "Yükleme başarısız."); }
    else { setAvatar(data.avatar ?? null); }

    setAvatarLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!newPassword) { setMsg({ type: "err", text: "Yeni şifre boş olamaz." }); return; }
    if (!currentPassword) { setMsg({ type: "err", text: "Mevcut şifreyi girin." }); return; }
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) { setMsg({ type: "err", text: data.error ?? "Hata oluştu." }); }
    else { setMsg({ type: "ok", text: "Şifre güncellendi." }); setCurrentPassword(""); setNewPassword(""); }
    setSaving(false);
  }

  return (
    <div className="p-6 md:p-8 max-w-xl space-y-6">

      {/* Avatar + info */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-5">

        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="group relative flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border-2 border-border bg-muted overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
            ) : avatar ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CameraIcon className="h-5 w-5 text-white" />
                </div>
              </>
            ) : (
              <>
                <span className="text-3xl font-bold text-muted-foreground select-none">
                  {name.charAt(0).toUpperCase()}
                </span>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <CameraIcon className="h-5 w-5 text-white" />
                </div>
              </>
            )}
          </div>

          {/* Upload badge */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <CameraIcon className="h-3.5 w-3.5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => void handleAvatarChange(e)}
          />
        </div>

        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground truncate">{name}</h1>
          <p className="text-sm text-muted-foreground truncate">{email}</p>
          {avatarError && (
            <p className="mt-1 text-xs text-red-400">{avatarError}</p>
          )}
          {!avatarError && (
            <p className="mt-1 text-xs text-muted-foreground/50">
              Fotoğrafı değiştirmek için üzerine tıklayın · JPEG, PNG, WebP · maks. 3 MB
            </p>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3">
        <div className={`rounded-xl border px-4 py-3 ${PERM_COLOR[permissions] ?? PERM_COLOR.none}`}>
          <p className="text-xs opacity-60 mb-0.5">Plan</p>
          <p className="text-sm font-semibold">{PERM_LABEL[permissions] ?? permissions}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
          <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
            <WalletIcon className="h-3 w-3" /> Bakiye
          </p>
          <p className="text-sm font-semibold text-foreground">{balance} €</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
          <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
            <ShieldIcon className="h-3 w-3" /> Rol
          </p>
          <p className="text-sm font-semibold text-foreground">{ROLE_LABEL[role] ?? role}</p>
        </div>
      </motion.div>

      {/* Password change */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Şifre Değiştir</h2>
        <form onSubmit={(e) => void handleSave(e)} className="space-y-3">
          {msg && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`rounded-lg px-3 py-2 text-sm ${msg.type === "ok" ? "bg-red-500/10 text-red-400" : "bg-red-500/10 text-red-400"}`}>
              {msg.text}
            </motion.p>
          )}

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">E-posta</label>
            <input value={email} disabled
              className="w-full rounded-lg border border-border bg-muted/10 px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kullanıcı Adı</label>
            <input value={name} disabled
              className="w-full rounded-lg border border-border bg-muted/10 px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed" />
            <p className="mt-1 text-[11px] text-muted-foreground/50">Kullanıcı adı değiştirilemez.</p>
          </div>

          <div className="border-t border-border pt-3 space-y-3">
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mevcut şifre"
                className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCurrent ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yeni şifre (en az 6 karakter)"
                className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNew ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
            {saving ? "Kaydediliyor…" : "Şifreyi Güncelle"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
