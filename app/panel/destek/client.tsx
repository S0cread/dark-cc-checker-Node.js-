"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

type TicketStatus = "open" | "in_progress" | "closed";
type TicketCategory = "genel" | "odeme" | "teknik" | "hesap" | "diger";

interface Ticket {
  id: string;
  category: TicketCategory;
  subject: string;
  message: string;
  status: TicketStatus;
  reply: string | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "genel", label: "Genel" },
  { value: "odeme", label: "Ödeme" },
  { value: "teknik", label: "Teknik" },
  { value: "hesap", label: "Hesap" },
  { value: "diger", label: "Diğer" },
];

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string }> = {
  open: { label: "Açık", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  in_progress: { label: "İşlemde", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  closed: { label: "Kapalı", color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

export function DestekClient() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [category, setCategory] = useState<TicketCategory>("genel");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/support");
      if (res.ok) setTickets(await res.json() as Ticket[]);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchTickets(); }, [fetchTickets]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject, message }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Bir hata oluştu."); return; }
      setSuccess("Destek talebiniz oluşturuldu! En kısa sürede yanıt verilecektir.");
      setSubject(""); setMessage(""); setCategory("genel");
      setShowForm(false);
      await fetchTickets();
    } catch {
      setError("Bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Destek Sistemi</h1>
          <p className="text-sm text-muted-foreground mt-1">Sorularınız için destek talebi oluşturun.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14"/></svg>
          Yeni Talep
        </button>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-foreground mb-4">Yeni Destek Talebi</h2>
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TicketCategory)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Konu</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Konunuzu kısaca belirtin..."
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Mesaj</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Sorununuzu detaylıca açıklayın... (en az 20 karakter)"
                    required
                    rows={5}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Gönderiliyor..." : "Gönder"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setError(""); }}
                    className="rounded-lg border border-border px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground text-sm">Henüz destek talebiniz yok.</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Yukarıdaki "Yeni Talep" butonuna tıklayarak başlayın.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((ticket) => {
            const st = STATUS_CONFIG[ticket.status];
            const isOpen = expandedId === ticket.id;
            return (
              <motion.div
                key={ticket.id}
                layout
                className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
              >
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
                        {CATEGORIES.find((c) => c.value === ticket.category)?.label} · {new Date(ticket.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
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
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Mesajınız</p>
                          <p className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-lg p-3">{ticket.message}</p>
                        </div>
                        {ticket.reply && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Destek Yanıtı</p>
                            <p className="text-sm text-foreground leading-relaxed bg-red-500/5 border border-red-500/15 rounded-lg p-3">{ticket.reply}</p>
                          </div>
                        )}
                        {!ticket.reply && ticket.status !== "closed" && (
                          <p className="text-xs text-muted-foreground italic">Yanıt bekleniyor...</p>
                        )}
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
