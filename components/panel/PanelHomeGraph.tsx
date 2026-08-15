"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import SimpleGraph from "@/components/SimpleGraph";

interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

interface Stats {
  cardLive: number;
  cardDead: number;
  cardCheck: number;
  binCheck: number;
  userRegister: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s önce`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}d önce`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}s önce`;
  return `${Math.floor(diffInSeconds / 86400)}g önce`;
}

function useCountUp(target: number, duration = 1800) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  const start = useRef<number | null>(null);
  const from = useRef(0);

  useEffect(() => {
    from.current = value;
    start.current = null;
    const tick = (ts: number) => {
      if (!start.current) start.current = ts;
      const elapsed = ts - start.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from.current + (target - from.current) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]); // eslint-disable-line

  return value;
}

function fmt(n: number) {
  return n.toLocaleString("tr-TR");
}

// ── Live ticking stat ─────────────────────────────────────────────────────────
function useLiveTick(base: number, tickEvery = 8000, increment = 1) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const id = setInterval(() => setVal((v) => v + increment), tickEvery);
    return () => clearInterval(id);
  }, [tickEvery, increment]);
  return val;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon,
  accent = false,
  delay = 0,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
  accent?: boolean;
  delay?: number;
}) {
  const displayed = useCountUp(value, 1600);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className={`flex flex-col gap-3 rounded-2xl border p-5 ${
        accent
          ? "border-red-500/25 bg-red-500/5"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            accent ? "bg-red-500/15 text-red-400" : "bg-muted text-muted-foreground"
          }`}
        >
          {icon}
        </span>
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight text-foreground">
          {fmt(displayed)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      </div>
    </motion.div>
  );
}

// ── Live badge ────────────────────────────────────────────────────────────────
function LiveBadge() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setOn((v) => !v), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-400">
      <span
        className={`h-1.5 w-1.5 rounded-full bg-red-400 transition-opacity ${on ? "opacity-100" : "opacity-30"}`}
      />
      Canlı
    </span>
  );
}

// ── Helper for color from red to green ───────────────────────────────────────
function getColorForValue(value: number, maxValue: number): string {
  const ratio = Math.min(value / maxValue, 1);
  if (ratio < 0.33) return "#ef4444"; // red
  if (ratio < 0.66) return "#eab308"; // yellow
  return "#22c55e"; // green
}

// ── Helper to get gradient color based on last value ─────────────────────────
function getGraphColors(monthlyData: { value: number; label: string }[]) {
  if (!monthlyData.length) return { line: "#ef4444", dot: "#ef4444" };
  const maxVal = Math.max(...monthlyData.map(d => d.value)) || 100;
  const color = getColorForValue(monthlyData[monthlyData.length - 1].value, maxVal);
  return { line: color, dot: color };
}

const TYPE_COLOR: Record<string, string> = {
  card_live: "bg-emerald-500/15 text-emerald-400",
  card_dead: "bg-red-500/15 text-red-400",
  card_check: "bg-slate-500/15 text-slate-400",
  bin_check: "bg-blue-500/15 text-blue-400",
  user_register: "bg-violet-500/15 text-violet-400",
  login: "bg-yellow-500/15 text-yellow-400",
};
const TYPE_LABEL: Record<string, string> = {
  card_live: "LIVE",
  card_dead: "DEAD",
  card_check: "Kart",
  bin_check: "BIN",
  user_register: "Kayıt",
  login: "Giriş",
};

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconSearch() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  );
}
function IconCreditCard() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" strokeLinecap="round" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
    </svg>
  );
}
function IconActivity() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Main export ───────────────────────────────────────────────────────────────
export function PanelHomeGraph() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<Stats>({
    cardLive: 0,
    cardDead: 0,
    cardCheck: 0,
    binCheck: 0,
    userRegister: 0,
  });
  const [monthlyStats, setMonthlyStats] = useState<{ value: number; label: string }[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [activitiesRes, announcementsRes] = await Promise.all([
        fetch("/api/activities"),
        fetch("/api/announcements"),
      ]);

      if (activitiesRes.ok) {
        const data = await activitiesRes.json();
        setActivities(data.activities || []);
        setStats(data.stats || {
          cardLive: 0,
          cardDead: 0,
          cardCheck: 0,
          binCheck: 0,
          userRegister: 0,
        });
        setMonthlyStats(data.monthlyStats || []);
      } else {
        console.error("Aktivite API hatası:", activitiesRes.status);
      }

      if (announcementsRes.ok) {
        setAnnouncements(await announcementsRes.json());
      } else {
        console.error("Duyuru API hatası:", announcementsRes.status);
      }
    } catch (e) {
      console.error("Veriler çekilemedi:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-6 space-y-5">
      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="LIVE Kart"
          value={stats.cardLive}
          sub="bugün bulunan LIVE"
          icon={<IconCreditCard />}
          accent={true}
          delay={0.05}
        />
        <StatCard
          label="DEAD Kart"
          value={stats.cardDead}
          sub="bugün checklenen DEAD"
          icon={<IconCreditCard />}
          delay={0.1}
        />
        <StatCard
          label="Kart Check"
          value={stats.cardCheck}
          sub="toplam kart kontrolü"
          icon={<IconCreditCard />}
          delay={0.15}
        />
        <StatCard
          label="BIN Sorgu"
          value={stats.binCheck}
          sub="bugün sorgulanan BIN"
          icon={<IconSearch />}
          delay={0.2}
        />
        <StatCard
          label="Yeni Kayıt"
          value={stats.userRegister}
          sub="bugün kayıt olan"
          icon={<IconUsers />}
          delay={0.25}
        />
      </div>

      {/* Graph + activity */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Graph */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.28 }}
          className="col-span-2 rounded-2xl border border-border bg-card p-5"
        >
          <div className="mb-1 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Aylık Sorgu Trendi</h2>
              <p className="text-xs text-muted-foreground">Son 7 ay toplam kart kontrolü</p>
            </div>
            <LiveBadge />
          </div>
          <div className="mt-4">
            {monthlyStats.length > 0 ? (
              <SimpleGraph
                data={monthlyStats}
                lineColor={getGraphColors(monthlyStats).line}
                dotColor={getGraphColors(monthlyStats).dot}
                height={240}
                showGrid
                gridStyle="dashed"
                gridLines="horizontal"
                showDots
                dotSize={5}
                dotHoverGlow
                curved
                gradientFade
                graphLineThickness={2.5}
                calculatePercentageDifference
                animateOnScroll
                animateOnce
                className="w-full"
              />
            ) : (
              <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
                Henüz veri yok
              </div>
            )}
          </div>
        </motion.div>

        {/* Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.35 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
            <h2 className="text-sm font-semibold text-foreground">Duyurular</h2>
          </div>
          <ul className="space-y-3 max-h-64 overflow-y-auto">
            {loading ? (
              <li className="text-center py-4 text-muted-foreground text-sm">Yükleniyor...</li>
            ) : announcements.length === 0 ? (
              <li className="text-center py-4 text-muted-foreground text-sm">Henüz duyuru yok</li>
            ) : (
              announcements.map((a) => (
                <li key={a.id} className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                  <h3 className="font-semibold text-white text-sm mb-1">{a.title}</h3>
                  <p className="whitespace-pre-wrap text-sm text-red-100/80">{a.content}</p>
                  <p className="mt-2 text-[10px] text-muted-foreground">{timeAgo(a.createdAt)}</p>
                </li>
              ))
            )}
          </ul>
        </motion.div>
      </div>

      {/* Status bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.42 }}
        className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-border bg-card px-5 py-3"
      >
        {[
          { label: "Checker API", ok: true },
          { label: "Market", ok: true },
          { label: "Destek", ok: true },
          { label: "Lanyard", ok: true },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${s.ok ? "bg-red-400" : "bg-red-400"}`}
            />
            <span className="text-xs text-muted-foreground">{s.label}</span>
            <span className={`text-[10px] font-medium ${s.ok ? "text-red-400" : "text-red-400"}`}>
              {s.ok ? "Aktif" : "Pasif"}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
