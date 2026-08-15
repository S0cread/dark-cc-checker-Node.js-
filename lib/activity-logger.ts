
import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "activities.json");

export type ActivityType = "card_live" | "card_dead" | "card_check" | "bin_check" | "user_register" | "login";

export interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string;
  userId?: string;
}

function loadActivities(): Activity[] {
  try {
    if (!fs.existsSync(FILE)) return [];
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as Activity[];
  } catch {
    return [];
  }
}

function saveActivities(activities: Activity[]) {
  // Keep only last 100 activities
  const recent = activities.slice(-100);
  fs.writeFileSync(FILE, JSON.stringify(recent, null, 2), "utf8");
}

export function logActivity(type: ActivityType, message: string, userId?: string) {
  const activities = loadActivities();
  activities.push({
    id: Date.now().toString(),
    type,
    message,
    timestamp: new Date().toISOString(),
    userId,
  });
  saveActivities(activities);
}

export function getActivities(limit = 20): Activity[] {
  const activities = loadActivities();
  return activities.slice(-limit).reverse();
}

export function getTodayStats() {
  const activities = loadActivities();
  const today = new Date().toISOString().slice(0, 10);
  
  let cardLive = 0;
  let cardDead = 0;
  let cardCheck = 0;
  let binCheck = 0;
  let userRegister = 0;

  for (const a of activities) {
    const aDate = a.timestamp.slice(0, 10);
    if (aDate === today) {
      if (a.type === "card_live") cardLive++;
      if (a.type === "card_dead") cardDead++;
      if (a.type === "card_check") cardCheck++;
      if (a.type === "bin_check") binCheck++;
      if (a.type === "user_register") userRegister++;
    }
  }

  return { cardLive, cardDead, cardCheck, binCheck, userRegister };
}

export function getMonthlyStats() {
  const activities = loadActivities();
  const now = new Date();
  const months: { [key: string]: number } = {};
  const monthLabels = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

  // Initialize last 7 months
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months[key] = 0;
  }

  // Count card_check activities per month
  for (const a of activities) {
    if (a.type === "card_check") {
      const aDate = new Date(a.timestamp);
      const key = `${aDate.getFullYear()}-${String(aDate.getMonth() + 1).padStart(2, "0")}`;
      if (months[key] !== undefined) {
        months[key]++;
      }
    }
  }

  // Convert to graph data format
  return Object.entries(months).map(([key, value]) => {
    const [year, month] = key.split("-").map(Number);
    return {
      value,
      label: monthLabels[month - 1],
    };
  });
}
