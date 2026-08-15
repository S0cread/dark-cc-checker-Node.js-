"use client";

import { useEffect, useRef, useState } from "react";

const USERS = [
  { id: "1513523084404195481", label: null },
  { id: "1517575892040290447", label: null },
];

interface SpotifyData {
  song: string;
  artist: string;
  album: string;
  album_art_url: string;
  track_id: string;
  timestamps: { start: number; end: number };
}

interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  discriminator: string;
}

interface LanyardData {
  discord_status: "online" | "idle" | "dnd" | "offline";
  discord_user: DiscordUser;
  listening_to_spotify: boolean;
  spotify: SpotifyData | null;
}

const STATUS_COLOR: Record<string, string> = {
  online: "#22c55e",
  idle: "#f59e0b",
  dnd: "#ef4444",
  offline: "#71717a",
};

const STATUS_LABEL: Record<string, string> = {
  online: "Çevrimiçi",
  idle: "Boşta",
  dnd: "Rahatsız Etme",
  offline: "Çevrimdışı",
};

function useSpotifyProgress(spotify: SpotifyData | null) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!spotify) { setProgress(0); return; }
    const tick = () => {
      const total = spotify.timestamps.end - spotify.timestamps.start;
      const elapsed = Date.now() - spotify.timestamps.start;
      setProgress(Math.min(100, (elapsed / total) * 100));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [spotify]);

  return progress;
}

function formatTime(ms: number) {
  const s = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

function useLanyard(userId: string) {
  const [data, setData] = useState<LanyardData | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const hbRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let alive = true;

    function connect() {
      if (!alive) return;
      const ws = new WebSocket("wss://api.lanyard.rest/socket");
      wsRef.current = ws;

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data as string) as { op: number; d?: unknown; t?: string };
        if (msg.op === 1) {
          const { heartbeat_interval } = msg.d as { heartbeat_interval: number };
          hbRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 3 }));
          }, heartbeat_interval);
          ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId } }));
        }
        if (msg.op === 0 && (msg.t === "INIT_STATE" || msg.t === "PRESENCE_UPDATE")) {
          const p = msg.d as LanyardData;
          if (p?.discord_status) setData(p);
        }
      };

      ws.onclose = () => {
        if (hbRef.current) clearInterval(hbRef.current);
        if (alive) setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      alive = false;
      if (hbRef.current) clearInterval(hbRef.current);
      wsRef.current?.close();
    };
  }, [userId]);

  return data;
}

function UserCard({ userId, label }: { userId: string; label?: string | null }) {
  const data = useLanyard(userId);
  const progress = useSpotifyProgress(data?.spotify ?? null);

  if (!data) {
    return (
      <div className="flex items-center gap-2.5 flex-1 min-w-0 px-4 py-2">
        <div className="h-7 w-7 rounded-full bg-muted animate-pulse shrink-0" />
        <div className="space-y-1 flex-1 min-w-0">
          <div className="h-2 w-20 rounded bg-muted animate-pulse" />
          <div className="h-1.5 w-14 rounded bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  const { discord_status, discord_user, listening_to_spotify, spotify } = data;
  const displayName = discord_user.global_name ?? discord_user.username;
  const avatarUrl = discord_user.avatar
    ? `https://cdn.discordapp.com/avatars/${discord_user.id}/${discord_user.avatar}.webp?size=64`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(discord_user.discriminator || "0") % 5}.png`;

  const elapsed = spotify ? Date.now() - spotify.timestamps.start : 0;
  const total = spotify ? spotify.timestamps.end - spotify.timestamps.start : 0;

  return (
    <div className="flex items-center gap-2.5 flex-1 min-w-0 px-4 py-2 overflow-hidden">
      {/* Avatar */}
      <div className="relative shrink-0">
        <img src={avatarUrl} alt={displayName} className="h-7 w-7 rounded-full object-cover ring-1 ring-border" />
        <span
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-[1.5px] border-card"
          style={{ backgroundColor: STATUS_COLOR[discord_status] ?? STATUS_COLOR.offline }}
        />
      </div>

      {/* Name + status */}
      <div className="flex flex-col shrink-0 leading-none">
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-semibold text-foreground">{displayName}</span>
          {label && (
            <span className="text-[9px] font-medium text-muted-foreground/60 bg-muted/50 rounded px-1 py-px">
              {label}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 font-medium tracking-tight" style={{ color: STATUS_COLOR[discord_status] }}>
          {STATUS_LABEL[discord_status]}
        </span>
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-border mx-1 shrink-0" />

      {/* Spotify */}
      {listening_to_spotify && spotify ? (
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="relative shrink-0">
            <img src={spotify.album_art_url} alt={spotify.album} className="h-7 w-7 rounded object-cover shadow" />
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#1DB954] flex items-center justify-center">
              <svg className="h-1.5 w-1.5 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <a
              href={`https://open.spotify.com/track/${spotify.track_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-foreground truncate hover:underline leading-tight"
            >
              {spotify.song}
            </a>
            <span className="text-[10px] text-muted-foreground truncate leading-tight">{spotify.artist}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] text-muted-foreground tabular-nums shrink-0">{formatTime(elapsed)}</span>
              <div className="relative h-0.5 flex-1 rounded-full bg-muted overflow-hidden">
                <div className="absolute inset-y-0 left-0 rounded-full bg-[#1DB954]" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[9px] text-muted-foreground tabular-nums shrink-0">{formatTime(total)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-muted-foreground/50 min-w-0">
          <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <span className="text-[10px] truncate">Müzik yok</span>
        </div>
      )}
    </div>
  );
}

export function LanyardBar() {
  return (
    <div className="sticky top-0 z-30 w-full border-b border-border bg-card/95 backdrop-blur-md font-sans">
      <div className="flex items-stretch divide-x divide-border">
        {USERS.map((u) => (
          <UserCard key={u.id} userId={u.id} label={u.label} />
        ))}
      </div>
    </div>
  );
}
