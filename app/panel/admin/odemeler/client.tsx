"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CheckIcon, XIcon } from "@/components/icons";

interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  crypto: string;
  txHash: string;
  status: "pending" | "approved" | "rejected";
  plan: string;
  createdAt: string;
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  sorgu:   { label: "Sorgu",           color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  checker: { label: "Checker",         color: "text-violet-400 bg-violet-400/10 border-violet-400/20" },
  full:    { label: "Sorgu + Checker", color: "text-red-400 bg-red-400/10 border-red-400/20" },
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "Bekliyor", className: "text-amber-400 bg-amber-400/10" },
  approved: { label: "Onaylandı", className: "text-red-400 bg-red-400/10" },
  rejected: { label: "Reddedildi", className: "text-red-400 bg-red-400/10" },
};

export default function AdminPaymentsClient() {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/payments");
    if (res.ok) setPayments(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAction(payment: PaymentRequest, status: "approved" | "rejected") {
    setActionLoading(payment.id + status);
    await fetch("/api/admin/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: payment.id, status }),
    });
    await load();
    setActionLoading(null);
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ödeme Talepleri</h1>
          <p className="mt-1 text-muted-foreground">Bekleyen kripto ödemelerini inceleyin ve onaylayın.</p>
        </div>
        <button onClick={load} className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors">
          Yenile
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Yükleniyor…</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground rounded-2xl border border-border">
          Henüz ödeme talebi yok.
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const statusInfo = STATUS_LABELS[p.status] ?? { label: p.status, className: "text-muted-foreground bg-muted/20" };
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{p.userName}</span>
                      <span className="text-xs text-muted-foreground">{p.userEmail}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {(() => {
                        const pl = PLAN_LABELS[p.plan];
                        return pl
                          ? <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${pl.color}`}>{pl.label}</span>
                          : <span>Plan: <span className="text-foreground font-medium">{p.plan}</span></span>;
                      })()}
                      <span>Kripto: <span className="text-foreground font-medium uppercase">{p.crypto}</span></span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono break-all">TX: {p.txHash}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleString("tr-TR")}
                    </p>
                  </div>

                  {p.status === "pending" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAction(p, "approved")}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        <CheckIcon className="w-4 h-4" />
                        Onayla
                      </button>
                      <button
                        onClick={() => handleAction(p, "rejected")}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        <XIcon className="w-4 h-4" />
                        Reddet
                      </button>
                    </div>
                  )}
                  {p.status !== "pending" && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                      {p.status === "approved" ? <CheckIcon className="w-4 h-4 text-red-400" /> : <XIcon className="w-4 h-4 text-red-400" />}
                      İşlendi
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

