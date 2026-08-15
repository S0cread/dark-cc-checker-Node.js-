"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CreditCardIcon, SearchIcon } from "@/components/icons";

interface BinResult {
  found: boolean;
  bin: string;
  bank?: string;
  bankCode?: string;
  type?: string;
  subType?: string;
  virtual?: boolean;
  prepaid?: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  VISA: "Visa", MASTERCARD: "Mastercard", "AMERICAN EXPRESS": "Amex",
  TROY: "Troy", MAESTRO: "Maestro", "": "Bilinmiyor",
};

export function BinCheckerClient() {
  const [bin, setBin] = useState("");
  const [bulk, setBulk] = useState("");
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BinResult | null>(null);
  const [bulkResults, setBulkResults] = useState<BinResult[]>([]);
  const [error, setError] = useState("");

  async function querySingle(b: string): Promise<BinResult> {
    const res = await fetch(`/api/checker/bin?bin=${b}`);
    return await res.json() as BinResult;
  }

  async function handleSingle() {
    const cleaned = bin.replace(/\D/g, "").slice(0, 6);
    if (cleaned.length < 4) { setError("En az 4 haneli BIN giriniz."); return; }
    setError(""); setLoading(true); setResult(null);
    try { setResult(await querySingle(cleaned)); }
    catch { setError("Sorgu başarısız."); }
    setLoading(false);
  }

  async function handleBulk() {
    const lines = bulk.split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setLoading(true); setBulkResults([]);
    const results: BinResult[] = [];
    const BATCH = 5;
    for (let i = 0; i < lines.length; i += BATCH) {
      const batch = lines.slice(i, i + BATCH);
      const batchRes = await Promise.all(batch.map(l => querySingle(l.replace(/\D/g,"").slice(0,6))));
      results.push(...batchRes);
      setBulkResults([...results]);
    }
    setLoading(false);
  }

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-3xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <CreditCardIcon className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">BIN Checker</h1>
          <p className="text-sm text-muted-foreground">Türk bankası BIN / IIN sorgulama — 407 kayıt</p>
        </div>
      </motion.div>

      {/* Mode tabs */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex gap-1 rounded-lg border border-border bg-muted/20 p-1 w-fit">
        {(["single", "bulk"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {m === "single" ? "Tekli Sorgulama" : "Toplu Sorgulama"}
          </button>
        ))}
      </motion.div>

      {/* Input card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-5 space-y-4">
        {mode === "single" ? (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">BIN / IIN Numarası</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={bin}
                onChange={(e) => { setBin(e.target.value.replace(/\D/g, "").slice(0, 8)); setResult(null); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && void handleSingle()}
                placeholder="413226"
                maxLength={8}
                className="flex-1 rounded-lg border border-border bg-muted/30 px-4 py-3 font-mono text-lg tracking-widest text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <button onClick={() => void handleSingle()} disabled={loading || bin.length < 4}
                className="flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
                {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" /> : <SearchIcon className="h-4 w-4" />}
                Sorgula
              </button>
            </div>
            {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
            <p className="mt-1.5 text-xs text-muted-foreground">İlk 4-6 haneyi girin · Enter ile sorgula</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-foreground">BIN Listesi</label>
              <span className="text-xs text-muted-foreground">{bulk.split("\n").filter(l=>l.trim()).length} adet</span>
            </div>
            <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={6} placeholder={"413226\n444676\n555555"}
              className="w-full rounded-lg border border-border bg-muted/20 px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none" />
            <button onClick={() => void handleBulk()} disabled={loading || !bulk.trim()}
              className="mt-3 flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
              {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" /> İşleniyor…</> : <><SearchIcon className="h-4 w-4" /> Toplu Sorgula</>}
            </button>
          </div>
        )}
      </motion.div>

      {/* Single result */}
      <AnimatePresence>
        {result && mode === "single" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`rounded-xl border p-5 space-y-3 ${result.found ? "border-accent/20 bg-accent/5" : "border-red-500/20 bg-red-500/5"}`}>
            {result.found ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">BIN: <span className="font-mono text-accent">{result.bin}</span></p>
                  <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-400">Bulundu</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: "Banka", val: result.bank ?? "—" },
                    { label: "Banka Kodu", val: result.bankCode ?? "—" },
                    { label: "Kart Ağı", val: TYPE_LABEL[result.type ?? ""] ?? result.type ?? "—" },
                    { label: "Kart Tipi", val: result.subType || "—" },
                    { label: "Sanal Kart", val: result.virtual ? "Evet" : "Hayır" },
                    { label: "Ön Ödemeli", val: result.prepaid ? "Evet" : "Hayır" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-border bg-card px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">{item.label}</p>
                      <p className="text-sm font-semibold text-foreground">{item.val}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-red-400 text-lg">✗</span>
                <div>
                  <p className="text-sm font-medium text-foreground">BIN bulunamadı: <span className="font-mono">{result.bin}</span></p>
                  <p className="text-xs text-muted-foreground">Bu BIN veritabanında kayıtlı değil.</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk results */}
      <AnimatePresence>
        {bulkResults.length > 0 && mode === "bulk" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-5 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground">Sonuçlar</p>
              <span className="text-xs text-muted-foreground">{bulkResults.filter(r=>r.found).length} / {bulkResults.length} bulundu</span>
            </div>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {bulkResults.map((r, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${r.found ? "border-accent/15 bg-accent/5" : "border-border bg-muted/10"}`}>
                  <span className={`font-mono text-xs font-bold w-16 shrink-0 ${r.found ? "text-accent" : "text-muted-foreground"}`}>{r.bin}</span>
                  {r.found ? (
                    <>
                      <span className="flex-1 truncate text-xs text-foreground font-medium">{r.bank}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{r.type}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{r.subType}</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Bulunamadı</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
