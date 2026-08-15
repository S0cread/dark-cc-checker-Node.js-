import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "checker-usage.json");
const FREE_DAILY_LIMIT = 100;

interface UsageRecord {
  date: string;
  count: number;
}

type UsageDB = Record<string, UsageRecord>;

function loadUsage(): UsageDB {
  try {
    if (!fs.existsSync(FILE)) return {};
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as UsageDB;
  } catch { return {}; }
}

function saveUsage(db: UsageDB) {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2), "utf8");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function getUsageInfo(userId: string): { count: number; limit: number; remaining: number; limitReached: boolean } {
  const db = loadUsage();
  const rec = db[userId];
  const t = today();
  const count = rec?.date === t ? rec.count : 0;
  const remaining = Math.max(0, FREE_DAILY_LIMIT - count);
  return { count, limit: FREE_DAILY_LIMIT, remaining, limitReached: count >= FREE_DAILY_LIMIT };
}

export function incrementUsage(userId: string): void {
  const db = loadUsage();
  const t = today();
  const rec = db[userId];
  db[userId] = { date: t, count: rec?.date === t ? rec.count + 1 : 1 };
  saveUsage(db);
}
