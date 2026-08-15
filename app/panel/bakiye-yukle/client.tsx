"use client";

import { useState, useRef } from "react";
import { CheckIcon, CopyIcon, CheckCheckIcon } from "@/components/icons";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "motion/react";

// ── Crypto ────────────────────────────────────────────────────────────────────
const CRYPTO_OPTIONS = [
  {
    id: "btc", symbol: "BTC", name: "Bitcoin",
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    color: "#F7931A",
    logo: (
      <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
        <circle cx="16" cy="16" r="16" fill="#F7931A" />
        <path d="M22.6 13.8c.3-2-1.2-3-3.3-3.7l.7-2.8-1.7-.4-.7 2.7c-.4-.1-.9-.2-1.3-.3l.7-2.7-1.7-.4-.7 2.8c-.3-.1-.7-.2-1-.2l-2.3-.6-.4 1.8s1.3.3 1.2.3c.7.2.8.6.8 1l-1.9 7.5c-.1.3-.4.8-1 .6l-1.2-.3-.8 2 2.2.5c.4.1.8.2 1.2.3l-.7 2.8 1.7.4.7-2.8c.5.1.9.2 1.4.3l-.7 2.8 1.7.4.7-2.8c2.8.5 4.9.3 5.8-2.2.7-2-.03-3.2-1.5-3.9 1.1-.3 1.9-1 2.1-2.5zm-3.8 5.3c-.5 2-3.8 1-4.8.7l.9-3.4c1 .3 4.3.8 3.9 2.7zm.5-5.3c-.5 1.8-3.2.9-4.1.7l.8-3.1c.9.2 3.8.7 3.3 2.4z" fill="white" />
      </svg>
    ),
  },
  {
    id: "eth", symbol: "ETH", name: "Ethereum",
    address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    color: "#627EEA",
    logo: (
      <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
        <circle cx="16" cy="16" r="16" fill="#627EEA" />
        <path d="M16 5l-.1.4v14.6l.1.1 6.5-3.8L16 5z" fill="white" fillOpacity=".6" />
        <path d="M16 5L9.5 16.3l6.5 3.8V5z" fill="white" />
        <path d="M16 21.2l-.1.1v4.8l.1.2 6.5-9.2-6.5 4.1z" fill="white" fillOpacity=".6" />
        <path d="M16 26.3v-5.1l-6.5-4.1 6.5 9.2z" fill="white" />
      </svg>
    ),
  },
  {
    id: "usdt", symbol: "USDT", name: "Tether TRC20",
    address: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
    color: "#26A17B",
    logo: (
      <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
        <circle cx="16" cy="16" r="16" fill="#26A17B" />
        <path d="M17.9 17.2c-.1 0-.7.1-1.9.1-1 0-1.6-.1-1.8-.1-3.6-.2-6.3-.8-6.3-1.5s2.7-1.3 6.3-1.5v2.3c.2 0 .8.1 1.8.1 1.1 0 1.7-.1 1.9-.1v-2.3c3.6.2 6.2.8 6.2 1.5s-2.6 1.3-6.2 1.5zm0-3.3V11.6h5V8.2H9.1v3.4h5v2.3c-4.1.2-7.1 1-7.1 2s3.1 1.8 7.1 2v7.1h3.8v-7.1c4-.2 7-1 7-2s-3-1.8-7-2z" fill="white" />
      </svg>
    ),
  },
  {
    id: "bnb", symbol: "BNB", name: "BNB",
    address: "bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2",
    color: "#F3BA2F",
    logo: (
      <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
        <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
        <path d="M12 16l-2-2 6-6 6 6-2 2-4-4-4 4zm-4 0l2 2-2 2-2-2 2-2zm8 8l-6-6 2-2 4 4 4-4 2 2-6 6zm6-6l2-2 2 2-2 2-2-2z" fill="white" />
      </svg>
    ),
  },
  {
    id: "trx", symbol: "TRX", name: "Tron",
    address: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
    color: "#EF0027",
    logo: (
      <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
        <circle cx="16" cy="16" r="16" fill="#EF0027" />
        <path d="M24.6 11.8L20.3 7H8l8.5 18.6 8.1-13.8zm-9.6 9.5L9.5 8.6h9.7l3.5 3.5-7.7 9.2z" fill="white" />
      </svg>
    ),
  },
];

// ── Plans ─────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "checker",
    name: "Checker",
    price: 30,
    icon: null,
    subtitle: "Kart doğrulama araçları",
    features: ["Kart Checker (PayPal)", "BIN Sorgulama", "Toplu İşlem", "Live / Dead Ayrımı", "Webhook Bildirimi"],
    highlight: true,
  },
] as const;

const PERM_NAMES: Record<string, string> = {
  none: "Ücretsiz",
  checker: "Checker",
};

// ── Moving border animation ───────────────────────────────────────────────────
function MovingBorder({ children, duration = 4000, rx, ry }: { children: React.ReactNode; duration?: number; rx?: string; ry?: string }) {
  const pathRef = useRef<SVGRectElement | null>(null);
  const progress = useMotionValue<number>(0);
  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength();
    if (length) progress.set((time * (length / duration)) % length);
  });
  const x = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val).x);
  const y = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val).y);
  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;
  return (
    <>
      <svg preserveAspectRatio="none" className="absolute h-full w-full" width="100%" height="100%">
        <rect fill="none" width="100%" height="100%" rx={rx} ry={ry} ref={pathRef} />
      </svg>
      <motion.div style={{ position: "absolute", top: 0, left: 0, display: "inline-block", transform }}>
        {children}
      </motion.div>
    </>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { void navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }}
      className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
      {ok ? <CheckCheckIcon className="w-3.5 h-3.5 text-accent" /> : <CopyIcon className="w-3.5 h-3.5" />}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BakiyeYukleClient({
  initialBalance,
  initialPermissions,
}: {
  initialBalance: number;
  initialPermissions: string;
}) {
  const [balance, setBalance] = useState(initialBalance);
  const [permissions, setPermissions] = useState(initialPermissions);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
  const [txHash, setTxHash] = useState("");
  const [tab, setTab] = useState<"buy" | "topup">("buy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<"bought" | "submitted" | null>(null);

  const plan = PLANS.find((p) => p.id === selectedPlan);
  const cryptoData = CRYPTO_OPTIONS.find((c) => c.id === selectedCrypto);
  const canAfford = plan ? balance >= plan.price : false;

  function pickPlan(id: string) {
    setSelectedPlan(id);
    setError("");
    const p = PLANS.find((x) => x.id === id);
    setTab(p && balance >= p.price ? "buy" : "topup");
  }

  async function handleBuy() {
    if (!selectedPlan) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/payment/buy-with-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan }),
      });
      const data = await res.json() as { success?: boolean; error?: string; permissions?: string; newBalance?: number };
      if (!res.ok) { setError(data.error ?? "Hata oluştu."); return; }
      setBalance(data.newBalance ?? balance);
      setPermissions(data.permissions ?? selectedPlan);
      setDone("bought");
    } catch { setError("Sunucuya ulaşılamadı."); }
    finally { setLoading(false); }
  }

  async function handleTopup(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan || !selectedCrypto || !txHash.trim()) { setError("Tüm alanları doldurun."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/payment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, crypto: selectedCrypto, txHash: txHash.trim() }),
      });
      if (!res.ok) { const d = await res.json() as { error?: string }; setError(d.error ?? "Hata."); return; }
      setDone("submitted");
    } catch { setError("Sunucuya ulaşılamadı."); }
    finally { setLoading(false); }
  }

  function reset() { setDone(null); setSelectedPlan(null); setTxHash(""); setSelectedCrypto(null); setError(""); }

  // ── Success ──
  if (done) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted border border-border">
            <CheckIcon className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {done === "bought" ? "Satın Alım Tamamlandı" : "Talep Alındı"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {done === "bought"
                ? <>Erişiminiz aktifleştirildi: <span className="text-foreground font-medium">{PERM_NAMES[permissions]}</span>. Yeni bakiye: <span className="font-medium">{balance}€</span></>
                : "Yönetici onayı sonrasında bakiyeniz ve erişiminiz aktifleşecek."}
            </p>
          </div>
          <button onClick={reset}
            className="w-full rounded-xl border border-border bg-card py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Tamam
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto space-y-8">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Bakiye & Erişim</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Bakiyenizle plan satın alın veya kripto ile bakiye yükleyin</p>
        </div>

        {/* Balance card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-0.5 shrink-0 w-fit">
          <div className="absolute inset-0 rounded-2xl">
            <MovingBorder duration={5000} rx="16" ry="16">
              <div className="h-20 w-20 bg-[radial-gradient(var(--accent)_15%,transparent_80%)] opacity-25" />
            </MovingBorder>
          </div>
          <div className="relative rounded-[14px] bg-card px-5 py-3 flex items-center gap-4">
            <div>
              <p className="text-[11px] text-muted-foreground/70 uppercase tracking-widest font-medium">Bakiye</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{balance}<span className="text-base font-medium text-muted-foreground ml-0.5">€</span></p>
            </div>
            {permissions !== "none" && (
              <div className="h-8 w-px bg-border" />
            )}
            {permissions !== "none" && (
              <div>
                <p className="text-[11px] text-muted-foreground/70 uppercase tracking-widest font-medium">Aktif Plan</p>
                <p className="text-sm font-semibold text-foreground">{PERM_NAMES[permissions]}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Plan cards */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest mb-4">Erişim Planları</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Free plan */}
          <div className={`flex flex-col rounded-2xl border p-5 ${permissions === "none" ? "border-border/50 bg-muted/10" : "border-border bg-card"}`}>
            <div className="mb-4">
              <h3 className="text-base font-semibold text-foreground">Ücretsiz</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Temel platform erişimi</p>
            </div>
            <div className="mb-4">
              <span className="text-2xl font-bold text-foreground">0€</span>
              <span className="text-xs text-muted-foreground ml-1">/ay</span>
            </div>
            <ul className="space-y-1.5 flex-1 mb-5">
              {["Panel erişimi", "Destek talebi", "Market görüntüleme"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckIcon className="w-3 h-3 shrink-0 text-muted-foreground/40" />{f}
                </li>
              ))}
            </ul>
            <div className={`rounded-xl border py-2 text-center text-xs ${permissions === "none" ? "border-border text-muted-foreground" : "border-border/30 text-muted-foreground/40"}`}>
              {permissions === "none" ? "Mevcut Plan" : "Temel Plan"}
            </div>
          </div>
          {PLANS.map((p, i) => {
            const owned = permissions === p.id;
            const active = selectedPlan === p.id;
            const affordable = balance >= p.price;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 + i * 0.04 }}
                onClick={() => !owned && pickPlan(p.id)}
                className={`relative flex flex-col rounded-2xl border p-5 transition-all duration-200 ${
                  owned
                    ? "border-border/50 bg-muted/10 cursor-default opacity-70"
                    : active
                    ? "border-accent/40 bg-accent/5 ring-1 ring-accent/20 cursor-pointer"
                    : "border-border bg-card hover:border-muted-foreground/30 cursor-pointer"
                }`}
              >
                {p.highlight && !owned && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border border-accent/30 bg-accent/10 px-3 py-0.5 text-[10px] font-semibold text-accent whitespace-nowrap">
                    Popüler
                  </span>
                )}
                {active && !owned && (
                  <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                    <CheckIcon className="w-3 h-3 text-accent-foreground" />
                  </span>
                )}

                <div className="mb-4">
                  <h3 className="text-base font-semibold text-foreground">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.subtitle}</p>
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-bold text-foreground">{p.price}€</span>
                  <span className="text-xs text-muted-foreground ml-1">/ay</span>
                </div>

                <ul className="space-y-1.5 flex-1 mb-5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckIcon className="w-3 h-3 shrink-0 text-accent/70" />
                      {f}
                    </li>
                  ))}
                </ul>

                {owned ? (
                  <div className="rounded-xl border border-border py-2 text-center text-xs text-muted-foreground">
                    Mevcut Plan
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); pickPlan(p.id); }}
                    className={`w-full rounded-xl py-2.5 text-xs font-medium transition-colors ${
                      affordable
                        ? "bg-foreground text-background hover:opacity-80"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {affordable ? `${p.price}€ ile Satın Al` : "Bakiye Yükle"}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Action panel ── */}
      <AnimatePresence>
        {selectedPlan && permissions !== selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            {/* Tab bar */}
            <div className="flex border-b border-border bg-muted/10">
              <button
                onClick={() => setTab("buy")}
                className={`flex-1 py-3.5 text-sm transition-colors ${tab === "buy" ? "text-foreground font-medium border-b-2 border-accent -mb-px" : "text-muted-foreground hover:text-foreground"}`}
              >
                Bakiye ile Satın Al
                {canAfford && (
                  <span className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent/20 text-accent text-[9px] font-bold">✓</span>
                )}
              </button>
              <button
                onClick={() => setTab("topup")}
                className={`flex-1 py-3.5 text-sm transition-colors ${tab === "topup" ? "text-foreground font-medium border-b-2 border-accent -mb-px" : "text-muted-foreground hover:text-foreground"}`}
              >
                Kripto ile Yükle
              </button>
            </div>

            {/* Buy with balance */}
            {tab === "buy" && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/10 px-4 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{plan?.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Onay beklenmez — anında aktifleşir</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">{plan?.price}€</p>
                    <p className={`text-xs ${canAfford ? "text-accent" : "text-red-400"}`}>
                      {canAfford ? `Bakiye yeterli` : `Eksik: ${(plan?.price ?? 0) - balance}€`}
                    </p>
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-2.5 text-xs text-red-400">{error}</p>
                )}

                <div className="flex gap-2.5">
                  <button
                    onClick={() => void handleBuy()}
                    disabled={loading || !canAfford}
                    className="flex-1 rounded-xl bg-foreground py-3 text-sm font-medium text-background hover:opacity-80 disabled:opacity-40 transition-opacity"
                  >
                    {loading ? "İşleniyor…" : canAfford ? `${plan?.price}€ Öde & Aktifleştir` : "Yetersiz Bakiye"}
                  </button>
                  {!canAfford && (
                    <button onClick={() => setTab("topup")}
                      className="flex-1 rounded-xl border border-border py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Bakiye Yükle →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Crypto top-up */}
            {tab === "topup" && (
              <div className="p-6 space-y-5">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{plan?.price}€</span> değerinde kripto gönderin.
                  TX Hash&apos;ini ekleyin — yönetici onayı sonrası bakiye ve erişiminiz aktifleşir.
                </p>

                {/* Crypto selector */}
                <div className="flex flex-wrap gap-2">
                  {CRYPTO_OPTIONS.map((c) => (
                    <button key={c.id} onClick={() => setSelectedCrypto(c.id)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                        selectedCrypto === c.id
                          ? "border-accent/40 bg-accent/8 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                      }`}>
                      {c.logo}
                      {c.symbol}
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {cryptoData && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="rounded-xl border border-border bg-muted/10 px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-foreground">{cryptoData.name} Adresi</span>
                          <CopyBtn text={cryptoData.address} />
                        </div>
                        <p className="text-xs font-mono text-muted-foreground break-all">{cryptoData.address}</p>
                        <p className="mt-2 text-[11px] text-amber-400/80">Ödeme gönderildikten sonra TX Hash&apos;ini aşağıya yapıştırın.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={(e) => void handleTopup(e)} className="space-y-3">
                  {error && (
                    <p className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-2.5 text-xs text-red-400">{error}</p>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">İşlem Hash (TX ID)</label>
                    <input
                      type="text"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      placeholder="İşlem hash'ini buraya yapıştırın…"
                      className="w-full rounded-xl border border-border bg-muted/10 px-4 py-3 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
                    />
                  </div>
                  <button type="submit" disabled={loading || !selectedCrypto || !txHash.trim()}
                    className="w-full rounded-xl bg-foreground py-3 text-sm font-medium text-background hover:opacity-80 disabled:opacity-40 transition-opacity">
                    {loading ? "Gönderiliyor…" : "Ödeme Talebini Gönder"}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
