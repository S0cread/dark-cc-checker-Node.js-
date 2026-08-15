"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { SettingsIcon, EyeIcon, EyeOffIcon } from "@/components/icons";

const API_FIELDS: { key: string; label: string; desc: string }[] = [
  { key: "kart_checker", label: "Kart Checker API", desc: "Kart doğrulama servisi API anahtarı" },
  { key: "bin_checker", label: "BIN Checker API", desc: "BIN sorgulama servisi API anahtarı" },
  { key: "kisi_sorgulama", label: "Kişi Sorgulama API", desc: "Kişi bilgisi sorgulama API anahtarı" },
  { key: "vesika_sorgulama", label: "Vesika Sorgulama API", desc: "Nüfus cüzdanı sorgulama API anahtarı" },
  { key: "tapu_sorgulama", label: "Tapu Sorgulama API", desc: "Tapu bilgisi sorgulama API anahtarı" },
  { key: "isyeri_sorgulama", label: "İşyeri Sorgulama API", desc: "İşyeri/vergi sorgulama API anahtarı" },
  { key: "nvi_cozumleri", label: "Nvi Çözümleri API", desc: "NVI sorgulama API anahtarı" },
  { key: "pdf_cozumleri", label: "PDF Çözümleri API", desc: "PDF oluşturma servisi API anahtarı" },
];

export function ApiAyarlariClient() {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/api-keys")
      .then((r) => r.json())
      .then((data: Record<string, string>) => { setKeys(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(keys),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <SettingsIcon className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">API Ayarları</h1>
            <p className="text-sm text-muted-foreground">Servis API anahtarlarını buradan yönetin</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border border-border bg-card p-5 space-y-4"
      >
        {loading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Yükleniyor…</div>
        ) : (
          <>
            {API_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-foreground">{field.label}</label>
                <p className="text-xs text-muted-foreground mb-1.5">{field.desc}</p>
                <div className="relative">
                  <input
                    type={visible[field.key] ? "text" : "password"}
                    value={keys[field.key] ?? ""}
                    onChange={(e) => setKeys((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder="API anahtarını girin…"
                    className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 pr-10 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <button
                    type="button"
                    onClick={() => setVisible((prev) => ({ ...prev, [field.key]: !prev[field.key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {visible[field.key] ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </button>
              {saved && <span className="text-sm text-red-400">Kaydedildi ✓</span>}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
