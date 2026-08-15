"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { ShoppingCartIcon, SearchIcon, XIcon } from "@/components/icons";

interface Card {
  id: string;
  bin: string;
  country: string;
  countryCode: string;
  bank: string;
  cardHolder: string;
  level: string;
  type: "CREDIT" | "DEBIT";
  brand: string;
  seller: string;
  month: string;
  year: string;
  price: number;
  hasCvv: boolean;
  hasRefund: boolean;
  extraInfo: string;
  sold: boolean;
}

const LEVEL_COLORS: Record<string, string> = {
  CLASSIC: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  STANDARD: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  GOLD: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  PERSONAL: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  "PERSONAL CORE": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  SIGNATURE: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  PLATINUM: "bg-slate-400/20 text-slate-300 border-slate-400/30",
};

const TYPE_COLORS: Record<string, string> = {
  CREDIT: "bg-red-500/20 text-red-300 border-red-500/30",
  DEBIT: "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

const FLAG_MAP: Record<string, string> = { TR: "🇹🇷", US: "🇺🇸", DE: "🇩🇪", GB: "🇬🇧", FR: "🇫🇷" };

interface BuyModalProps { card: Card; onClose: () => void; onConfirm: () => void; buying: boolean; }

function BuyModal({ card, onClose, onConfirm, buying }: BuyModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm mx-4 rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Satın Alma Onayı</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4 text-sm mb-5">
          <p className="flex justify-between"><span className="text-muted-foreground">BIN</span><span className="font-mono font-semibold text-foreground">{card.bin}</span></p>
          <p className="flex justify-between"><span className="text-muted-foreground">Banka</span><span className="text-foreground text-right max-w-[180px] truncate">{card.bank}</span></p>
          <p className="flex justify-between"><span className="text-muted-foreground">Kart Sahibi</span><span className="text-foreground">{card.cardHolder}</span></p>
          <p className="flex justify-between"><span className="text-muted-foreground">SKT</span><span className="font-mono text-foreground">{card.month}/{card.year}</span></p>
          <p className="flex justify-between border-t border-border pt-2 mt-2">
            <span className="text-muted-foreground">Fiyat</span>
            <span className="font-bold text-accent">${card.price.toFixed(2)}</span>
          </p>
          {card.hasRefund && <p className="text-xs text-red-400 flex items-center gap-1">✓ Ölü karta iade garantisi</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm text-muted-foreground hover:text-foreground">
            İptal
          </button>
          <button
            onClick={onConfirm}
            disabled={buying}
            className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {buying ? "İşlem yapılıyor…" : "Satın Al"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function MarketClient() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterBrand, setFilterBrand] = useState("ALL");
  const [buyCard, setBuyCard] = useState<Card | null>(null);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/market");
    if (res.ok) setCards(await res.json() as Card[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const filtered = cards.filter((c) => {
    if (c.sold) return false;
    if (filterType !== "ALL" && c.type !== filterType) return false;
    if (filterBrand !== "ALL" && c.brand !== filterBrand) return false;
    const q = search.toLowerCase();
    if (q && !c.bin.includes(q) && !c.bank.toLowerCase().includes(q) && !c.cardHolder.toLowerCase().includes(q)) return false;
    return true;
  });

  const brands = [...new Set(cards.map((c) => c.brand))];

  async function handleBuy() {
    if (!buyCard) return;
    setBuying(true);
    setError("");
    const res = await fetch("/api/market/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: buyCard.id }),
    });
    const data = await res.json() as { error?: string; purchaseId?: string };
    setBuying(false);
    if (!res.ok) { setError(data.error ?? "Hata oluştu."); setBuyCard(null); return; }
    setBuyCard(null);
    router.refresh();
    router.push(`/panel/market/satin-al/${data.purchaseId!}`);
  }

  return (
    <div className="p-4 md:p-6">
      <AnimatePresence>
        {buyCard && <BuyModal card={buyCard} onClose={() => setBuyCard(null)} onConfirm={handleBuy} buying={buying} />}
      </AnimatePresence>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCartIcon className="h-6 w-6 text-accent" /> Market
          </h1>
          <p className="text-sm text-muted-foreground">{filtered.length} kart mevcut</p>
        </div>
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm text-red-400">
            {error}
          </motion.p>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="BIN, banka veya kart sahibi ara…"
            className="w-full rounded-lg border border-border bg-muted/30 py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
          />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none">
          <option value="ALL">Tüm Tipler</option>
          <option value="CREDIT">CREDIT</option>
          <option value="DEBIT">DEBIT</option>
        </select>
        <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none">
          <option value="ALL">Tüm Markalar</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-xs md:text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground">
              {["BIN", "Ülke", "Banka", "Kart Sahibi", "Seviye", "Tip", "Marka", "Satıcı", "SKT", "Fiyat", "CVV", "İade", "Eylem"].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={13} className="py-12 text-center text-muted-foreground">Yükleniyor…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={13} className="py-12 text-center text-muted-foreground">Kart bulunamadı.</td></tr>
            ) : filtered.map((card, i) => (
              <motion.tr
                key={card.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors"
              >
                <td className="px-3 py-2.5 font-mono font-semibold text-foreground">{card.bin}</td>
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-1 text-foreground">
                    {FLAG_MAP[card.countryCode] ?? "🌐"} {card.country}
                  </span>
                </td>
                <td className="px-3 py-2.5 max-w-[160px] truncate text-muted-foreground">{card.bank || "-"}</td>
                <td className="px-3 py-2.5 text-foreground">{card.cardHolder}</td>
                <td className="px-3 py-2.5">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${LEVEL_COLORS[card.level] ?? "bg-muted/30 text-muted-foreground border-border"}`}>
                    {card.level || "-"}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${TYPE_COLORS[card.type] ?? ""}`}>
                    {card.type}
                  </span>
                </td>
                <td className="px-3 py-2.5 font-semibold text-foreground">{card.brand}</td>
                <td className="px-3 py-2.5 text-accent font-medium">{card.seller}</td>
                <td className="px-3 py-2.5 font-mono text-foreground">{card.month}/{card.year}</td>
                <td className="px-3 py-2.5 font-bold text-accent">${card.price.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-center">
                  {card.hasCvv ? <span className="text-red-400">✓</span> : <span className="text-red-400">✗</span>}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {card.hasRefund ? <span className="text-red-400">✓</span> : <span className="text-red-400">✗</span>}
                </td>
                <td className="px-3 py-2.5">
                  <button
                    onClick={() => setBuyCard(card)}
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:opacity-90 transition-opacity"
                  >
                    <ShoppingCartIcon className="h-3.5 w-3.5" /> Sepete Ekle
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
