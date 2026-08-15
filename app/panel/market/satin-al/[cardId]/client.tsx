"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CreditCardIcon, ShieldIcon, SearchIcon } from "@/components/icons";
import type { Purchase } from "@/lib/db";
import Link from "next/link";

function formatCard(num: string) {
  return num.replace(/(\d{4})/g, "$1 ").trim();
}

export function PurchaseDetailClient({ purchase }: { purchase: Purchase }) {
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<"unchecked" | "live" | "dead">(purchase.checkStatus);

  async function handleCheck() {
    setChecking(true);
    const res = await fetch("/api/market/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseId: purchase.id }),
    });
    const data = await res.json() as { status?: "live" | "dead" };
    if (res.ok && data.status) setStatus(data.status);
    setChecking(false);
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-4"
      >
        <div className="text-center mb-6">
          <ShieldIcon className="mx-auto h-10 w-10 text-accent mb-2" />
          <h1 className="text-2xl font-bold text-foreground">Satın Alınan Kart</h1>
          <p className="text-sm text-muted-foreground mt-1">Bu bilgiler yalnızca size özeldir</p>
        </div>

        {/* Card Visual */}
        <motion.div
          className="relative rounded-2xl bg-gradient-to-br from-accent/20 via-accent/5 to-transparent border border-accent/20 p-6 overflow-hidden"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-accent/5 -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <CreditCardIcon className="h-8 w-8 text-accent" />
              <span className="text-sm font-bold text-muted-foreground">{purchase.bin.slice(0, 6)}xxxxxx</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Kart Numarası</p>
              <p className="text-xl font-bold tracking-widest text-foreground font-mono">
                {formatCard(purchase.cardNumber)}
              </p>
            </div>
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Son Kullanım</p>
                <p className="font-semibold text-foreground font-mono">{purchase.month}/{purchase.year}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CVV</p>
                <p className="font-semibold text-foreground font-mono">{purchase.cvv}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kart Sahibi</p>
                <p className="font-semibold text-foreground">{purchase.cardHolder}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Details */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm">
          <p className="flex justify-between"><span className="text-muted-foreground">Banka</span><span className="text-foreground font-medium">{purchase.bank || "-"}</span></p>
          <p className="flex justify-between"><span className="text-muted-foreground">Ödenen Tutar</span><span className="text-accent font-bold">${purchase.pricePaid.toFixed(2)}</span></p>
          <p className="flex justify-between"><span className="text-muted-foreground">Tarih</span><span className="text-foreground">{new Date(purchase.createdAt).toLocaleString("tr-TR")}</span></p>
          <p className="flex justify-between">
            <span className="text-muted-foreground">Durum</span>
            <span className={`font-bold ${status === "live" ? "text-red-400" : status === "dead" ? "text-red-400" : "text-muted-foreground"}`}>
              {status === "live" ? "✓ LIVE" : status === "dead" ? "✗ DEAD" : "Kontrol edilmedi"}
            </span>
          </p>
        </div>

        {/* Check Button */}
        {status === "unchecked" && (
          <button
            onClick={handleCheck}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {checking ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" /> Kontrol ediliyor…</>
            ) : (
              <><SearchIcon className="h-5 w-5" /> Kartı Kontrol Et</>
            )}
          </button>
        )}

        {status === "live" && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
            <p className="text-red-400 font-bold text-lg">✓ LIVE</p>
            <p className="text-sm text-red-400/70 mt-0.5">Kart aktif durumda</p>
          </div>
        )}
        {status === "dead" && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
            <p className="text-red-400 font-bold text-lg">✗ DEAD</p>
            <p className="text-sm text-red-400/70 mt-0.5">Kart geçersiz — iade politikasına göre bakiyeniz iade edildi</p>
          </div>
        )}

        <Link
          href="/panel/market"
          className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Markete Dön
        </Link>
      </motion.div>
    </div>
  );
}
