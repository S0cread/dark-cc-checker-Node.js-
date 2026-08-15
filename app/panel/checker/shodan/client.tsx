
"use client";

import { useState } from "react";
import { motion } from "motion/react";

interface ShodanHost {
  ip_str: string;
  org: string;
  os: string | null;
  ports: number[];
  location: {
    city: string;
    region_code: string;
    area_code: number;
    longitude: number;
    country_code3: string;
    latitude: number;
    country_code: string;
    country_name: string;
  };
  data: Array<{
    port: number;
    protocol: string;
    product?: string;
    version?: string;
    data?: string;
    module?: string;
  }>;
  last_update: string;
  [key: string]: any;
}

export function ShodanClient() {
  const [ip, setIp] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShodanHost | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!ip.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/shodan?ip=${encodeURIComponent(ip.trim())}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Sorgu başarısız");
      }

      const data = await response.json();
      setResult(data);
    } catch (e) {
      console.error("Shodan hatası:", e);
      setError(e instanceof Error ? e.message : "Sorgu başarısız oldu");
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
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/5">
          <svg
            className="h-4 w-4 text-blue-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-tight">Shodan Sorgulama</h1>
          <p className="text-[11px] text-muted-foreground">
            IP adresini Shodan'da araştır
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
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="IP adresi girin"
              className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Tüm Bilgiler Tablosu */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="3.6 9 12 3 20.4 9" />
                  <line x1="12" y1="3" x2="12" y2="21" />
                </svg>
                Tüm Bilgiler
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/10">
                    <td className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-40">IP Adresi</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{result.ip_str}</td>
                  </tr>
                  <tr className="hover:bg-muted/10">
                    <td className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organizasyon</td>
                    <td className="px-4 py-3 text-sm text-foreground">{result.org || "-"}</td>
                  </tr>
                  <tr className="hover:bg-muted/10">
                    <td className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ülke / Şehir</td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {result.location?.country_name || "-"}
                      {result.location?.city ? ` / ${result.location.city}` : ""}
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/10">
                    <td className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Koordinatlar</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {result.location?.latitude && result.location?.longitude 
                        ? `${result.location.latitude}, ${result.location.longitude}`
                        : "-"}
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/10">
                    <td className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">İşletim Sistemi</td>
                    <td className="px-4 py-3 text-sm text-foreground">{result.os || "-"}</td>
                  </tr>
                  <tr className="hover:bg-muted/10">
                    <td className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Açık Portlar</td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {result.ports?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {result.ports.map((p) => (
                            <span key={p} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : "-"}
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/10">
                    <td className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Son Güncelleme</td>
                    <td className="px-4 py-3 text-sm text-foreground">{formatDate(result.last_update)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tüm Diğer Bilgiler (Ham Veri) */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Tüm Ham Bilgiler
              </h2>
            </div>
            <div className="p-4">
              <details>
                <summary className="text-xs text-muted-foreground cursor-pointer inline-flex items-center gap-1">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                  Tüm Veriyi Göster
                </summary>
                <pre className="mt-2 text-[10px] bg-muted/20 p-3 rounded border border-border overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          </div>

          {/* Portlar Tablosu */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">
                Açık Portlar
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                {result.ports?.length || 0}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/20">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Port</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ürün</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Versiyon</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(result.data || []).map((service, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.03 }}
                      className="hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {service.port}/{service.protocol}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{service.product || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{service.version || "-"}</td>
                      <td className="px-4 py-3">
                        {service.data ? (
                          <details>
                            <summary className="text-xs text-muted-foreground cursor-pointer inline-flex items-center gap-1">
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <polyline points="16 18 22 12 16 6" />
                                <polyline points="8 6 2 12 8 18" />
                              </svg>
                              Göster
                            </summary>
                            <pre className="mt-2 text-[10px] bg-muted/20 p-2 rounded border border-border overflow-auto max-h-40">
                              {service.data}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
