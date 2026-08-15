"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

type TicketStatus = "open" | "in_progress" | "closed";
type TicketCategory = "genel" | "odeme" | "teknik" | "hesap" | "diger";

interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: TicketCategory;
  subject: string;
  message: string;
  status: TicketStatus;
  reply: string | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES: Record<TicketCategory, string> = {
  genel: "Genel", odeme: "Ödeme", teknik: "Teknik", hesap: "Hesap", diger: "Diğer",
};

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string }> = {
  open: { label: "Açık", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  in_progress: { label: "İşlemde", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  closed: { label: "Kapalı", color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

export function AdminDestekClient() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | TicketStatus>("all");

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/support");
      if (res.ok) setTickets(await res.json() as Ticket[]);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchTickets(); }, [fetchTickets]);

  async function handleUpdate(id: string, status: TicketStatus, reply?: string) {
    setSaving(id);
    try {
      await fetch(`/api/admin/support/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reply: reply ?? undefined }),
      });
      await fetchTickets();
    } catch { /* silent */ } finally {
      setSaving(null);
    }
  }

  const filtered = filterStatus === "all" ? tickets : tickets.filter((t) => t.status === filterStatus);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Destek Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-1">Tüm destek taleplerini görüntüleyin ve yanıtlayın.</p>
        </div>
        <div className="flex gap-2">
          {(["all", "open", "in_progress", "closed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filterStatus === s ? "bg-accent text-accent-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
            >
              {s === "all" ? "Tümü" : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl border border-border bg-card animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground text-sm">Destek talebi bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((ticket) => {
            const st = STATUS_CONFIG[ticket.status];
            const isOpen = expandedId === ticket.id;
            const currentReply = replyText[ticket.id] ?? ticket.reply ?? "";

            return (
              <motion.div key={ticket.id} layout className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <button
                  onClick={() => setExpandedId(isOpen ? null : ticket.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium shrink-0 ${st.color}`}>
                      {st.label}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ticket.userName} · {ticket.userEmail} · {CATEGORIES[ticket.category]} · {new Date(ticket.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <svg className={`h-4 w-4 text-muted-foreground shrink-0 ml-3 transition-transform ${isOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m6 9 6 6 6-6"/></svg>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Kullanıcı Mesajı</p>
                          <p className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-lg p-3">{ticket.message}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Durum:</span>
                          {(["open", "in_progress", "closed"] as TicketStatus[]).map((s) => (
                            <button
                              key={s}
                              onClick={() => void handleUpdate(ticket.id, s, currentReply || undefined)}
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${ticket.status === s ? STATUS_CONFIG[s].color : "border-border text-muted-foreground hover:border-accent/50"}`}
                            >
                              {STATUS_CONFIG[s].label}
                            </button>
                          ))}
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Yanıt</p>
                          <textarea
                            value={currentReply}
                            onChange={(e) => setReplyText((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                            placeholder="Kullanıcıya yanıt yazın..."
                            rows={4}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            disabled={saving === ticket.id}
                            onClick={() => void handleUpdate(ticket.id, ticket.status === "open" ? "in_progress" : ticket.status, currentReply || undefined)}
                            className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
                          >
                            {saving === ticket.id ? "Kaydediliyor..." : "Yanıtla & Kaydet"}
                          </button>
                          <button
                            disabled={saving === ticket.id}
                            onClick={() => void handleUpdate(ticket.id, "closed", currentReply || undefined)}
                            className="rounded-lg border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                          >
                            Kapat
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
