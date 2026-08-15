
"use client";

import { useState } from "react";
import { motion } from "motion/react";

interface UsomResult {
  id?: number;
  url?: string;
  type?: string;
  category?: string;
  source?: string;
  date?: string;
  desc?: string;
  criticality_level?: number;
  connectiontype?: string;
  [key: string]: any;
}

export function UsomClient() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UsomResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setRawResponse(null);

    try {
      const response = await fetch(`/api/usom?q=${encodeURIComponent(query.trim())}`);
      const data = await response.json();
      setRawResponse(data);

      console.log("Client cevap:", data);

      // TÜM olası dizileri kontrol et
      let found: UsomResult[] = [];
      if (Array.isArray(data.models)) {
        found = data.models;
      } else if (Array.isArray(data.result)) {
        found = data.result;
      } else if (Array.isArray(data.results)) {
        found = data.results;
      } else if (Array.isArray(data.data)) {
        found = data.data;
      } else if (Array.isArray(data.items)) {
        found = data.items;
      } else if (Array.isArray(data.list)) {
        found = data.list;
      } else if (Array.isArray(data)) {
        found = data;
      }

      console.log("Bulunan sonuçlar:", found);
      setResults(found);
    } catch (e) {
      console.error("Client hatası:", e);
      setError("Sorgu başarısız oldu, lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5">
          <svg
            className="h-4 w-4 text-red-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-tight">USOM Sorgulama</h1>
          <p className="text-[11px] text-muted-foreground">
            Ulusal Siber Olaylara Müdahale Merkezi adres/IP sorgulama
          </p>
        </div>
      </motion.div>

      {/* Search Area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Domain girin"
              className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-accent hover:bg-accent/90 text-accent-foreground px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M4 12a8 8 0 018-8" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
            )}
            {loading ? "Sorgulanıyor..." : "Sorgula"}
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
            <p className="text-[12px] text-red-400 font-medium">{error}</p>
          </div>
        )}
      </motion.div>
      {/* Table Results */}
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Bulunan Sonuçlar</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground">
                {results.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/20">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Adres
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Kaynak
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.map((result, index) => (
                  <motion.tr
                    key={result.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-foreground break-all max-w-xs block">
                        {result.url}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(result.date)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">
                        {result.desc || result.category || result.type || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        {result.source || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={result.url?.startsWith("http") ? result.url : `https://${result.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        Göster
                      </a>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {results.length === 0 && !loading && !error && query.trim() && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-border bg-card p-8 text-center"
        >
          <svg className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-muted-foreground">Sonuç bulunamadı</p>
        </motion.div>
      )}
    </div>
  );
}
