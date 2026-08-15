"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCartIcon, XIcon } from "@/components/icons";

interface MarketCard {
  id: string;
  bin: string;
  country: string;
  countryCode: string;
  bank: string;
  cardHolder: string;
  level: string;
  type: string;
  brand: string;
  seller: string;
  month: string;
  year: string;
  price: number;
  hasCvv: boolean;
  hasRefund: boolean;
  extraInfo: string;
  sold: boolean;
  cardNumber: string | null;
  cvv: string | null;
}

const EMPTY_FORM = {
  bin: "",
  country: "TURKEY",
  countryCode: "TR",
  bank: "",
  cardHolder: "",
  level: "CLASSIC",
  type: "CREDIT",
  brand: "VISA",
  seller: "",
  month: "",
  year: "",
  price: "",
  hasCvv: true,
  hasRefund: true,
  extraInfo: "",
  cardNumber: "",
  cvv: "",
};

const LEVELS = ["CLASSIC", "STANDARD", "GOLD", "PERSONAL", "PERSONAL CORE", "SIGNATURE", "PLATINUM", "BUSINESS"];
const BRANDS = ["VISA", "MASTERCARD", "DISCOVER", "AMEX", "TROY", "JCB"];
const COUNTRIES = [
  { code: "TR", name: "TURKEY" }, { code: "US", name: "USA" },
  { code: "DE", name: "GERMANY" }, { code: "GB", name: "UK" },
  { code: "FR", name: "FRANCE" }, { code: "NL", name: "NETHERLANDS" },
];

type FormData = typeof EMPTY_FORM;

const inputCls = "w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30";
const labelCls = "block text-xs font-medium text-muted-foreground mb-1";

function AddCardModal({ onClose, onSave }: { onClose: () => void; onSave: (data: FormData) => Promise<string | null> }) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handle() {
    if (!form.bin || !form.cardHolder || !form.seller || !form.month || !form.year || !form.price) {
      setError("Zorunlu alanları doldurun: BIN, Kart Sahibi, Satıcı, Ay, Yıl, Fiyat");
      return;
    }
    setSaving(true);
    setError("");
    const err = await onSave(form);
    if (err) { setError(err); setSaving(false); return; }
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm py-6 px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl my-4"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-foreground">Yeni Kart Ekle</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>BIN <span className="text-red-400">*</span></label>
            <input value={form.bin} onChange={(e) => set("bin", e.target.value)} maxLength={8} placeholder="454360" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Kart Sahibi <span className="text-red-400">*</span></label>
            <input value={form.cardHolder} onChange={(e) => set("cardHolder", e.target.value)} placeholder="Ayşe" className={inputCls} />
          </div>

          <div className="col-span-1 sm:col-span-2">
            <label className={labelCls}>Kart Numarası <span className="text-muted-foreground/60">(opsiyonel — girilmezse BIN&apos;den üretilir)</span></label>
            <input value={form.cardNumber} onChange={(e) => set("cardNumber", e.target.value)} maxLength={16} placeholder="4543601234567890" className={`${inputCls} font-mono`} />
          </div>

          <div>
            <label className={labelCls}>CVV <span className="text-muted-foreground/60">(opsiyonel)</span></label>
            <input value={form.cvv} onChange={(e) => set("cvv", e.target.value)} maxLength={4} placeholder="123" className={`${inputCls} font-mono`} />
          </div>
          <div>
            <label className={labelCls}>Banka</label>
            <input value={form.bank} onChange={(e) => set("bank", e.target.value)} placeholder="TURKIYE IS BANKASI, A.S." className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>SKT Ay <span className="text-red-400">*</span></label>
            <input value={form.month} onChange={(e) => set("month", e.target.value)} maxLength={2} placeholder="01-12" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>SKT Yıl (2 hane) <span className="text-red-400">*</span></label>
            <input value={form.year} onChange={(e) => set("year", e.target.value)} maxLength={2} placeholder="29" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Ülke</label>
            <select value={form.countryCode} onChange={(e) => {
              const c = COUNTRIES.find((x) => x.code === e.target.value);
              set("countryCode", e.target.value);
              if (c) set("country", c.name);
            }} className={inputCls}>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Seviye</label>
            <select value={form.level} onChange={(e) => set("level", e.target.value)} className={inputCls}>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tip</label>
            <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputCls}>
              <option value="CREDIT">CREDIT</option>
              <option value="DEBIT">DEBIT</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Marka</label>
            <select value={form.brand} onChange={(e) => set("brand", e.target.value)} className={inputCls}>
              {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Satıcı <span className="text-red-400">*</span></label>
            <input value={form.seller} onChange={(e) => set("seller", e.target.value)} placeholder="DarkTR" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Fiyat ($) <span className="text-red-400">*</span></label>
            <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="5.00" className={inputCls} />
          </div>

          <div className="col-span-1 sm:col-span-2">
            <label className={labelCls}>Ekstra Bilgi</label>
            <input value={form.extraInfo} onChange={(e) => set("extraInfo", e.target.value)} placeholder="Opsiyonel not" className={inputCls} />
          </div>

          <div className="col-span-1 sm:col-span-2 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.hasCvv} onChange={(e) => set("hasCvv", e.target.checked)} className="h-4 w-4 rounded accent-accent" />
              <span className="text-sm text-foreground">CVV Mevcut</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.hasRefund} onChange={(e) => set("hasRefund", e.target.checked)} className="h-4 w-4 rounded accent-accent" />
              <span className="text-sm text-foreground">İade Garantisi</span>
            </label>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            İptal
          </button>
          <button onClick={handle} disabled={saving} className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
            {saving ? "Ekleniyor…" : "Kartı Ekle"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function AdminMarketClient() {
  const [cards, setCards] = useState<MarketCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/market");
    if (res.ok) setCards(await res.json() as MarketCard[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function addCard(form: FormData): Promise<string | null> {
    let res: Response;
    try {
      res = await fetch("/api/admin/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bin: form.bin,
          country: form.country,
          countryCode: form.countryCode,
          bank: form.bank,
          cardHolder: form.cardHolder,
          level: form.level,
          type: form.type,
          brand: form.brand,
          seller: form.seller,
          month: form.month,
          year: form.year,
          price: parseFloat(String(form.price)) || 0,
          hasCvv: form.hasCvv,
          hasRefund: form.hasRefund,
          extraInfo: form.extraInfo,
          cardNumber: form.cardNumber.trim() || null,
          cvv: form.cvv.trim() || null,
        }),
      });
    } catch {
      return "Sunucuya bağlanılamadı.";
    }
    let data: { error?: string } = {};
    try { data = await res.json() as { error?: string }; } catch { /* empty body */ }
    if (!res.ok) return data.error ?? `HTTP ${res.status} hatası.`;
    showToast("ok", "Kart başarıyla eklendi.");
    await load();
    return null;
  }

  async function deleteCard(id: string) {
    setDeleting(id);
    const res = await fetch("/api/admin/market", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) { showToast("ok", "Kart silindi."); await load(); }
    else showToast("err", "Silme başarısız.");
    setDeleting(null);
    setConfirmDel(null);
  }

  const available = cards.filter((c) => !c.sold).length;
  const sold = cards.filter((c) => c.sold).length;

  return (
    <div className="p-6 md:p-8">
      <AnimatePresence>
        {showAdd && <AddCardModal onClose={() => setShowAdd(false)} onSave={addCard} />}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-4 right-4 z-50 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-xl ${toast.type === "ok" ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}
          >
            {toast.type === "ok" ? "✓" : "✗"} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCartIcon className="h-6 w-6 text-accent" /> Market Yönetimi
          </h1>
          <div className="mt-1 flex gap-4 text-sm text-muted-foreground">
            <span className="text-red-400 font-medium">{available} mevcut</span>
            <span className="text-red-400 font-medium">{sold} satıldı</span>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 transition-opacity"
        >
          + Kart Ekle
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Yükleniyor…</div>
      ) : cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <ShoppingCartIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground">Henüz kart yok. &quot;Kart Ekle&quot; butonuna tıklayın.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                {["BIN", "Kart Sahibi", "Banka", "Seviye", "Tip", "Marka", "SKT", "Fiyat", "CVV", "İade", "Durum", "İşlem"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <motion.tr
                  key={card.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`border-b border-border last:border-0 transition-colors ${card.sold ? "opacity-50" : "hover:bg-muted/10"}`}
                >
                  <td className="px-3 py-2.5 font-mono font-semibold text-foreground">{card.bin}</td>
                  <td className="px-3 py-2.5 text-foreground">{card.cardHolder}</td>
                  <td className="px-3 py-2.5 max-w-[140px] truncate text-muted-foreground">{card.bank || "-"}</td>
                  <td className="px-3 py-2.5 text-foreground text-xs">{card.level}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${card.type === "CREDIT" ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-orange-500/30 bg-orange-500/10 text-orange-300"}`}>
                      {card.type}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-foreground">{card.brand}</td>
                  <td className="px-3 py-2.5 font-mono text-foreground">{card.month}/{card.year}</td>
                  <td className="px-3 py-2.5 font-bold text-accent">${card.price.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-center">{card.hasCvv ? <span className="text-red-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                  <td className="px-3 py-2.5 text-center">{card.hasRefund ? <span className="text-red-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${card.sold ? "bg-red-500/10 text-red-400" : "bg-red-500/10 text-red-400"}`}>
                      {card.sold ? "Satıldı" : "Mevcut"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {confirmDel === card.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => deleteCard(card.id)} disabled={deleting === card.id} className="rounded px-2 py-1 bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30">
                          {deleting === card.id ? "…" : "Evet"}
                        </button>
                        <button onClick={() => setConfirmDel(null)} className="rounded px-2 py-1 border border-border text-xs text-muted-foreground">
                          Hayır
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDel(card.id)} className="rounded-lg border border-red-500/20 px-2.5 py-1 text-xs text-red-400/70 hover:border-red-500/40 hover:text-red-400 transition-colors">
                        Sil
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
