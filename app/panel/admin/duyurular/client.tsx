
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { XIcon, PlusIcon, EditIcon, TrashIcon, EyeIcon, EyeOffIcon } from "@/components/icons";
import type { Announcement } from "@/lib/announcements";

export default function AdminAnnouncementsClient() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", isActive: true });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/announcements");
    if (res.ok) setAnnouncements(await res.json());
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;

    if (editingId) {
      await fetch("/api/admin/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...form }),
      });
    } else {
      await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    setShowModal(false);
    setEditingId(null);
    setForm({ title: "", content: "", isActive: true });
    await load();
  }

  async function toggleActive(id: string, currentActive: boolean) {
    await fetch("/api/admin/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !currentActive }),
    });
    await load();
  }

  async function handleDelete() {
    if (!deletingId) return;
    await fetch("/api/admin/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deletingId }),
    });
    setDeletingId(null);
    await load();
  }

  function openEdit(announcement: Announcement) {
    setEditingId(announcement.id);
    setForm({
      title: announcement.title,
      content: announcement.content,
      isActive: announcement.isActive,
    });
    setShowModal(true);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="p-6 md:p-8 space-y-5">
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg mx-4 rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-foreground">
                  {editingId ? "Duyuru Düzenle" : "Yeni Duyuru"}
                </h3>
                <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted">
                  <XIcon className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Başlık</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Duyuru başlığı..."
                    className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">İçerik</label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="Duyuru içeriği..."
                    rows={6}
                    className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="rounded border-border bg-muted/30 text-accent focus:ring-accent/30"
                    />
                    Aktif
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-border py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    İptal
                  </button>
                  <button type="submit" className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity">
                    {editingId ? "Güncelle" : "Oluştur"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeletingId(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm mx-4 rounded-2xl border border-red-500/25 bg-card p-6 shadow-2xl"
            >
              <h3 className="font-semibold text-foreground mb-2">Duyuru Sil</h3>
              <p className="text-sm text-muted-foreground mb-5">Bu duyuruyu silmek istediğinizden emin misiniz?</p>
              <div className="flex gap-2">
                <button onClick={() => setDeletingId(null)} className="flex-1 rounded-lg border border-border py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  İptal
                </button>
                <button onClick={handleDelete} className="flex-1 rounded-lg bg-red-500/20 text-red-400 py-2.5 text-sm font-medium hover:bg-red-500/30 transition-colors">
                  Sil
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Duyuru Yönetimi</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Tüm duyuruları oluştur, düzenle ve yönet</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
        >
          <PlusIcon className="h-4 w-4" />
          Yeni Duyuru
        </button>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Yükleniyor…</div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm rounded-2xl border border-border bg-card">
          Henüz duyuru yok
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{announcement.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      announcement.isActive
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-muted/30 text-muted-foreground"
                    }`}>
                      {announcement.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{announcement.content}</p>
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>Oluşturan: {announcement.authorName || "Admin"}</span>
                    <span>•</span>
                    <span>{formatDate(announcement.createdAt)}</span>
                    {announcement.updatedAt !== announcement.createdAt && (
                      <>
                        <span>•</span>
                        <span>Güncellendi: {formatDate(announcement.updatedAt)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleActive(announcement.id, announcement.isActive)}
                    title={announcement.isActive ? "Pasif yap" : "Aktif yap"}
                    className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {announcement.isActive ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(announcement)}
                    title="Düzenle"
                    className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <EditIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(announcement.id)}
                    title="Sil"
                    className="rounded-lg p-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
