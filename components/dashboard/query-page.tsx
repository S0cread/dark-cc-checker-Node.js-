"use client";

import { motion } from "motion/react";
import { SearchIcon, XIcon, DownloadIcon } from "@/components/icons";
import { useState } from "react";

interface QueryPageProps {
  title: string;
  description: string;
  inputLabel: string;
  inputPlaceholder: string;
  /** API çağrısı burada yapılacak — şimdilik boş bırakıldı. */
  onQuery?: (value: string) => Promise<unknown>;
  /** Sonuçlar bu formatta gösterilebilir (API’den dönen veri). */
  results?: unknown[];
}

export function QueryPage({
  title,
  description,
  inputLabel,
  inputPlaceholder,
  onQuery,
  results = [],
}: QueryPageProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<unknown[]>(results);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    try {
      if (onQuery) {
        const res = await onQuery(value.trim());
        setData(Array.isArray(res) ? res : res ? [res] : []);
      } else {
        // API boş — demo için boş sonuç
        setData([]);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setValue("");
    setData([]);
  }

  return (
    <div className="p-6 md:p-8">
      <motion.div
        className="rounded-xl border border-border bg-card p-6 shadow-lg"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-1 text-muted-foreground">{description}</p>

        <form onSubmit={handleSubmit} className="mt-6">
          <label className="block text-sm font-medium text-foreground">
            {inputLabel}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={inputPlaceholder}
            className="mt-2 w-full rounded-lg border border-border bg-muted/50 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            disabled={loading}
          />
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <SearchIcon className="h-4 w-4" />
              {loading ? "Sorgulanıyor…" : "Sorgula"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              <XIcon className="h-4 w-4" />
              Temizle
            </button>
          </div>
        </form>
      </motion.div>

      <motion.div
        className="mt-6 rounded-xl border border-border bg-card p-6 shadow-lg"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Sonuçlar</h2>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500"
          >
            <DownloadIcon className="h-4 w-4" />
            İndir
          </button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Tabloda toplam {data.length} sonuç bulunmaktadır.
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 font-medium text-foreground">#</th>
                <th className="px-4 py-3 font-medium text-foreground">Veri</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Henüz sonuç yok. Sorgu yaparak API’den veri çekebilirsiniz.
                  </td>
                </tr>
              ) : (
                data.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-border last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 text-foreground">
                      {typeof row === "object" && row !== null
                        ? JSON.stringify(row)
                        : String(row)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
