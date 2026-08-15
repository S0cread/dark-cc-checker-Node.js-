"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Purchase {
  id: string;
  cardNumber: string;
  month: string;
  year: string;
  cvv: string;
  cardHolder: string;
  bankName?: string;
  pricePaid: number;
  checkStatus: "unchecked" | "live" | "dead";
  createdAt: string;
}

const STATUS = {
  unchecked: { label: "Kontrol Bekliyor", cls: "bg-muted/40 text-muted-foreground border-border", dot: "bg-muted-foreground" },
  live: { label: "LIVE", cls: "bg-red-500/10 text-red-400 border-red-500/25", dot: "bg-red-400" },
  dead: { label: "DEAD", cls: "bg-red-500/10 text-red-400 border-red-500/25", dot: "bg-red-400" },
};

function maskCard(n: string) {
  const d = n.replace(/\s/g, "");
  return d.slice(0, 6) + " •••• •••• " + d.slice(-4);
}

function CardVisual({ p }: { p: Purchase }) {
  const s = STATUS[p.checkStatus];
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 ${
      p.checkStatus === "live" ? "bg-gradient-to-br from-red-950/40 to-card border-red-500/20" :
      p.checkStatus === "dead" ? "bg-gradient-to-br from-red-950/20 to-card border-red-500/15" :
      "bg-gradient-to-br from-accent/5 to-card border-border"
    }`}>
      {/* Top row */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full animate-pulse ${s.dot}`} />
          <span className={`text-[10px] font-bold uppercase tracking-widest border rounded-full px-2 py-0.5 ${s.cls}`}>
            {s.label}
          </span>
        </div>
        <div className="flex gap-1">
          <div className="h-5 w-7 rounded-sm bg-yellow-400/80" />
          <div className="h-5 w-7 rounded-sm bg-red-500/70 -ml-3" />
        </div>
      </div>

      {/* Card number */}
      <p className="font-mono text-lg font-bold tracking-[0.2em] text-foreground mb-4">
        {maskCard(p.cardNumber)}
      </p>

      {/* Bottom info */}
      <div className="flex items-end justify-between">
        <div className="flex gap-5 text-xs">
          <div>
            <p className="text-[9px] text-muted-foreground mb-0.5 uppercase tracking-wider">SKT</p>
            <p className="font-mono font-semibold text-foreground">{p.month}/{p.year}</p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground mb-0.5 uppercase tracking-wider">CVV</p>
            <p className="font-mono font-semibold text-foreground">{p.cvv}</p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground mb-0.5 uppercase tracking-wider">Sahibi</p>
            <p className="text-xs font-semibold text-foreground uppercase">{p.cardHolder}</p>
          </div>
        </div>
        {p.bankName && (
          <p className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">{p.bankName}</p>
        )}
      </div>
    </div>
  );
}

export function SatinAlimlarimClient() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState<string | null>(null);

  const load = useCallback(() => {
    void fetch("/api/market/purchases")
      .then((r) => r.json())
      .then((d) => { setPurchases(d as Purchase[]); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function doCheck(purchaseId: string) {
    setChecking(purchaseId);
    const res = await fetch("/api/market/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseId }),
    });
    const data = await res.json() as { status?: string };
    setChecking(null);
    if (data.status) {
      setPurchases((prev) =>
        prev.map((p) => p.id === purchaseId ? { ...p, checkStatus: data.status as Purchase["checkStatus"] } : p)
      );
      router.refresh();
    }
  }

  const live = purchases.filter((p) => p.checkStatus === "live");
  const unchecked = purchases.filter((p) => p.checkStatus === "unchecked");
  const dead = purchases.filter((p) => p.checkStatus === "dead");
  const ordered = [...live, ...unchecked, ...dead];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Satın Alımlarım</h1>
          <p className="text-sm text-muted-foreground mt-1">Marketten aldığınız kartlar — yalnızca size özeldir</p>
        </div>
        <Link href="/panel/market"
          className="flex w-fit items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/70 hover:border-foreground/20 transition-all">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" strokeLinecap="round"/>
            <path d="M3 6h18M16 10a4 4 0 0 1-8 0" strokeLinecap="round"/>
          </svg>
          Markete Git
        </Link>
      </div>

      {/* Stats */}
      {!loading && purchases.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          {[
            { label: "Toplam", val: purchases.length, cls: "text-foreground", border: "border-l-foreground/40" },
            { label: "Live", val: live.length, cls: "text-red-400", border: "border-l-red-500/50" },
            { label: "Dead", val: dead.length, cls: "text-red-400", border: "border-l-red-500/50" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border border-border bg-card/80 pl-4 pr-4 py-4 border-l-4 ${s.border} shadow-sm`}>
              <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${s.cls}`}>{s.val}</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground mr-2" />
          Yükleniyor…
        </div>
      ) : purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 sm:py-28 text-center">
          <div className="rounded-2xl border border-border bg-card/80 p-8 sm:p-10 max-w-sm shadow-sm">
            <div className="w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-5">
              <svg className="h-7 w-7 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="4" width="22" height="16" rx="2" strokeLinecap="round"/><path d="M1 10h22" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="font-semibold text-foreground mb-1">Henüz satın alım yok</p>
            <p className="text-sm text-muted-foreground mb-6">Marketten kart satın alarak burada görüntüleyebilirsiniz.</p>
            <Link href="/panel/market"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background text-sm font-semibold px-5 py-2.5 hover:opacity-90 transition-opacity">
              Markete Git
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round"/></svg>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {ordered.map((p, i) => (
              <motion.div key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col gap-3 group"
              >
                <div className="rounded-2xl overflow-hidden bg-card/50 shadow-sm transition-shadow group-hover:shadow-md">
                  <CardVisual p={p} />
                  <div className="px-4 pb-4 pt-0 flex items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">${p.pricePaid}</span>
                      <span className="mx-1.5">·</span>
                      <span>{new Date(p.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    {p.checkStatus === "unchecked" ? (
                      <button onClick={() => void doCheck(p.id)}
                        disabled={checking === p.id}
                        className="flex items-center gap-1.5 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-semibold px-3 py-1.5 hover:bg-red-500/25 transition-colors disabled:opacity-50">
                        {checking === p.id ? (
                          <><span className="h-3 w-3 animate-spin rounded-full border border-red-400 border-t-transparent" />Kontrol…</>
                        ) : (
                          <><svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" strokeLinecap="round"/></svg>Kontrol Et</>
                        )}
                      </button>
                    ) : (
                      <Link href={`/panel/market/satin-al/${p.id}`}
                        className="rounded-lg border border-border bg-muted/30 text-xs font-medium text-foreground px-3 py-1.5 hover:bg-muted/60 transition-colors">
                        Detay →
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
