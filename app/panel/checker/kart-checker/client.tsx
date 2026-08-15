"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

interface CheckResult {
  card: string;
  status: "live" | "dead" | "error";
  message: string;
}

const GATEWAYS = [
  {
    id: "paypal",
    label: "PayPal Auth",
    tag: "B3",
    description: "PayPal GraphQL · WooCommerce checkout üzerinden CVV/AVS doğrulama",
    color: "blue",
  },
  {
    id: "wargame",
    label: "3$ Check",
    tag: "$3",
    description: "Düşük tutarlı ürün üzerinden kart doğrulama",
    color: "red",
  },
  {
    id: "braintree",
    label: "Braintree",
    tag: "VBV",
    description: "Braintree tokenize endpoint · Yakında aktif edilecek",
    color: "violet",
    disabled: true,
  },
] as const;

type GatewayId = (typeof GATEWAYS)[number]["id"];

const COLOR_MAP = {
  blue: {
    badge: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    ring: "ring-blue-500/30",
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    dot: "bg-blue-400",
  },
  violet: {
    badge: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    ring: "ring-violet-500/30",
    border: "border-violet-500/30",
    bg: "bg-violet-500/5",
    dot: "bg-violet-400",
  },
  red: {
    badge: "bg-red-500/10 border-red-500/20 text-red-400",
    ring: "ring-red-500/30",
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    dot: "bg-red-400",
  },
};

function CardRow({ r, i }: { r: CheckResult; i: number }) {
  const [copied, setCopied] = useState(false);
  const live = r.status === "live";
  const dead = r.status === "dead";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: i * 0.02 }}
      className={`group flex items-start gap-2 rounded-lg border px-3 py-2.5 transition-colors ${
        live ? "border-red-500/20 bg-red-500/5 hover:bg-red-500/8"
        : dead ? "border-red-500/15 bg-red-500/5 hover:bg-red-500/8"
        : "border-yellow-500/15 bg-yellow-500/5"
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[11px] font-semibold text-foreground truncate">{r.card}</p>
        <p className={`text-[10px] mt-0.5 leading-tight ${live ? "text-red-400/70" : dead ? "text-red-400/60" : "text-yellow-400/60"}`}>
          {r.message}
        </p>
      </div>
      <button
        onClick={() => { void navigator.clipboard.writeText(r.card); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
        className="shrink-0 mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium opacity-0 group-hover:opacity-100 transition-opacity border border-border bg-background/80 text-muted-foreground hover:text-foreground"
      >
        {copied ? "✓" : "kopyala"}
      </button>
    </motion.div>
  );
}

export function KartCheckerClient({
  isFree = false,
  dailyUsed = 0,
  dailyLimit = 5,
}: {
  isFree?: boolean;
  dailyUsed?: number;
  dailyLimit?: number;
}) {
  const [gateway, setGateway] = useState<GatewayId>("wargame");
  const [cardList, setCardList] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [currentCard, setCurrentCard] = useState("");
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const abortRef = useRef(false);

  const lives = results.filter((r) => r.status === "live");
  const deads = results.filter((r) => r.status === "dead");
  const errors = results.filter((r) => r.status === "error");
  const cardCount = cardList.split("\n").filter((c) => c.trim()).length;

  const activeGw = GATEWAYS.find((g) => g.id === gateway)!;
  const activeColor = COLOR_MAP[activeGw.color];

  async function handleCheck() {
    const cards = cardList.split("\n").map((c) => c.trim()).filter(Boolean);
    if (!cards.length) return;
    abortRef.current = false;
    setLoading(true); setResults([]); setProgress(0); setTotal(cards.length);
    let done = 0;
    const BATCH = 3;

    async function checkOne(card: string): Promise<CheckResult> {
      try {
        const res = await fetch("/api/checker/kart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ card, gateway }),
        });
        const data = await res.json() as { status: string; message: string };
        const status: CheckResult["status"] =
          data.status === "LIVE" ? "live" :
          data.status === "DECLINED" || data.status === "DEAD" ? "dead" : "error";
        return { card, status, message: data.message ?? "" };
      } catch {
        return { card, status: "error", message: "Bağlantı hatası" };
      }
    }

    for (let i = 0; i < cards.length; i += BATCH) {
      if (abortRef.current) break;
      const batch = cards.slice(i, i + BATCH);
      setCurrentCard(batch[0] ?? "");
      const batchRes = await Promise.all(batch.map(checkOne));
      done += batchRes.length;
      setProgress(Math.round((done / cards.length) * 100));
      setResults((prev) => [...prev, ...batchRes]);
    }
    setProgress(100); setCurrentCard(""); setLoading(false);
  }

  return (
    <div className="p-5 md:p-7 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${activeColor.border} ${activeColor.bg}`}>
            <svg className={`h-4 w-4 ${activeGw.color === "blue" ? "text-blue-400" : activeGw.color === "violet" ? "text-violet-400" : "text-red-400"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">Kart Checker</h1>
            <p className="text-[11px] text-muted-foreground">Gateway üzerinden doğrulama · Çekim yapılmaz</p>
          </div>
        </div>
        {results.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-red-400"><span className="h-1.5 w-1.5 rounded-full bg-red-400" />{lives.length} Live</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="flex items-center gap-1.5 text-red-400"><span className="h-1.5 w-1.5 rounded-full bg-red-400" />{deads.length} Dead</span>
            {errors.length > 0 && <><span className="text-muted-foreground/40">·</span><span className="text-yellow-400">{errors.length} Err</span></>}
          </div>
        )}
      </motion.div>

      {/* ── Free limit banner ── */}
      {isFree && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
            dailyUsed >= dailyLimit
              ? "border-red-500/20 bg-red-500/6"
              : "border-amber-500/15 bg-amber-500/5"
          }`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full ${dailyUsed >= dailyLimit ? "bg-red-500/20" : "bg-amber-500/15"}`}>
              <div className={`h-2 w-2 rounded-full ${dailyUsed >= dailyLimit ? "bg-red-400" : "bg-amber-400"}`} />
            </div>
            <div>
              <p className={`text-xs font-semibold ${dailyUsed >= dailyLimit ? "text-red-400" : "text-amber-400"}`}>
                {dailyUsed >= dailyLimit
                  ? "Günlük limitiniz doldu"
                  : `Ücretsiz Plan · Günlük ${dailyLimit} kart`}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {dailyUsed >= dailyLimit
                  ? "Yarın sıfırlanır veya plan satın alarak sınırsız kullanın."
                  : `Bugün ${dailyUsed}/${dailyLimit} kart kullandınız.`}
              </p>
            </div>
          </div>
          <a href="/panel/bakiye-yukle"
            className="shrink-0 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[11px] font-medium text-amber-400 hover:bg-amber-500/20 transition-colors">
            Planı Yükselt
          </a>
        </motion.div>
      )}

      {/* ── Gateway selector ── */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Gateway Seç</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {GATEWAYS.map((gw) => {
            const c = COLOR_MAP[gw.color];
            const active = gateway === gw.id;
            return (
              <button
                key={gw.id}
                onClick={() => !gw.disabled && setGateway(gw.id)}
                disabled={gw.disabled || loading}
                className={`relative flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                  gw.disabled ? "opacity-40 cursor-not-allowed border-border bg-muted/10"
                  : active ? `${c.border} ${c.bg} ring-2 ${c.ring}`
                  : "border-border bg-card hover:border-border/80 hover:bg-muted/20"
                }`}
              >
                <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${active ? c.dot : "bg-muted-foreground/30"}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-foreground">{gw.label}</span>
                    <span className={`rounded px-1.5 py-px text-[9px] font-bold border ${c.badge}`}>{gw.tag}</span>
                    {gw.disabled && <span className="rounded px-1.5 py-px text-[9px] font-bold border border-border text-muted-foreground">Yakında</span>}
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">{gw.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Info banner — compact */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
        className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {["VISA", "MC", "AMEX", "DISC"].map((b) => (
            <span key={b} className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${activeColor.badge}`}>{b}</span>
          ))}
        </div>
        <span className="text-muted-foreground/30 hidden sm:block">|</span>
        <p className="text-[11px] text-muted-foreground">Format: <code className="font-mono text-foreground/70">4111...|MM|YY|CVV</code></p>
        <span className="text-muted-foreground/30 hidden sm:block">|</span>
        <p className="text-[11px] text-yellow-400/70">Tüm işlemler sorumluluğunuza aittir</p>
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
        {/* Left — input */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.09 }}
          className="flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/10">
              <span className="text-xs font-semibold text-foreground">Kart Listesi</span>
              {cardCount > 0 && <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${activeColor.badge}`}>{cardCount}</span>}
            </div>
            <textarea
              value={cardList}
              onChange={(e) => setCardList(e.target.value)}
              disabled={loading}
              rows={10}
              placeholder={"4111111111111111|01|25|123\n5500005555555559|12|26|456"}
              className="w-full resize-none bg-transparent px-4 py-3 text-xs font-mono text-foreground placeholder:text-muted-foreground/35 focus:outline-none disabled:opacity-50"
            />
          </div>

          <AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-xl border border-border bg-card px-4 py-3 space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">İşleniyor…</span>
                  <span className={`font-bold tabular-nums ${activeGw.color === "blue" ? "text-blue-400" : activeGw.color === "violet" ? "text-violet-400" : "text-red-400"}`}>{progress}%</span>
                </div>
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div className={`h-full rounded-full ${activeGw.color === "blue" ? "bg-blue-400" : activeGw.color === "violet" ? "bg-violet-400" : "bg-red-400"}`} style={{ width: `${progress}%` }} transition={{ ease: "linear" }} />
                </div>
                <p className="font-mono text-[10px] text-muted-foreground/60 truncate">{currentCard}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            <button onClick={() => void handleCheck()} disabled={loading || !cardList.trim()}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-40 active:scale-[0.98] ${
                activeGw.color === "blue" ? "bg-blue-500 text-white"
                : activeGw.color === "violet" ? "bg-violet-500 text-white"
                : "bg-red-500 text-white"
              }`}>
              {loading
                ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Kontrol ediliyor…</>
                : <>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
                    </svg>
                    Kontrol Et
                  </>
              }
            </button>
            {loading && (
              <button onClick={() => { abortRef.current = true; }}
                className="rounded-xl border border-red-500/25 bg-red-500/8 px-3 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/15 transition-colors">
                Durdur
              </button>
            )}
            {!loading && results.length > 0 && (
              <button onClick={() => { setResults([]); setCardList(""); setProgress(0); setTotal(0); }}
                className="rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                Temizle
              </button>
            )}
          </div>
        </motion.div>

        {/* Right — live / dead columns */}
        <div className="grid grid-cols-2 gap-3">
          {/* Live */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="flex flex-col rounded-xl border border-red-500/20 bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-red-500/15 bg-red-500/5">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/15">
                  <svg className="h-3.5 w-3.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span className="text-xs font-bold text-red-400">Live</span>
                <span className="rounded-full bg-red-500/15 px-2 py-px text-[10px] font-bold text-red-400">{lives.length}</span>
              </div>
              {lives.length > 0 && (
                <button onClick={() => void navigator.clipboard.writeText(lives.map(r => r.card).join("\n"))}
                  className="text-[10px] font-medium text-red-400/70 hover:text-red-400 transition-colors">Kopyala</button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[180px] max-h-[420px]">
              {lives.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-28 gap-1.5">
                  <div className="h-8 w-8 rounded-full border-2 border-dashed border-red-500/20 flex items-center justify-center text-red-500/25 text-base">✓</div>
                  <p className="text-[10px] text-muted-foreground/40">Henüz live yok</p>
                </div>
              ) : lives.map((r, i) => <CardRow key={i} r={r} i={i} />)}
            </div>
          </motion.div>

          {/* Dead */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="flex flex-col rounded-xl border border-red-500/15 bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-red-500/10 bg-red-500/5">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/15">
                  <svg className="h-3.5 w-3.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
                </div>
                <span className="text-xs font-bold text-red-400">Dead</span>
                <span className="rounded-full bg-red-500/15 px-2 py-px text-[10px] font-bold text-red-400">{deads.length}</span>
              </div>
              {deads.length > 0 && (
                <button onClick={() => void navigator.clipboard.writeText(deads.map(r => r.card).join("\n"))}
                  className="text-[10px] font-medium text-red-400/70 hover:text-red-400 transition-colors">Kopyala</button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[180px] max-h-[420px]">
              {deads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-28 gap-1.5">
                  <div className="h-8 w-8 rounded-full border-2 border-dashed border-red-500/15 flex items-center justify-center text-red-500/25 text-base">✗</div>
                  <p className="text-[10px] text-muted-foreground/40">Henüz dead yok</p>
                </div>
              ) : deads.map((r, i) => <CardRow key={i} r={r} i={i} />)}
            </div>
          </motion.div>

          {/* Errors — full width */}
          <AnimatePresence>
            {errors.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="col-span-2 overflow-hidden rounded-xl border border-yellow-500/15 bg-card">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-yellow-500/10 bg-yellow-500/5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-yellow-500/15">
                    <svg className="h-3 w-3 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v4M12 17h.01" strokeLinecap="round"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                  </div>
                  <span className="text-xs font-bold text-yellow-400">Hata</span>
                  <span className="rounded-full bg-yellow-500/15 px-2 py-px text-[10px] font-bold text-yellow-400">{errors.length}</span>
                </div>
                <div className="p-3 space-y-1.5 max-h-32 overflow-y-auto">
                  {errors.map((r, i) => <CardRow key={i} r={r} i={i} />)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
