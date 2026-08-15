
import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "announcements.json");

export interface Announcement {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  authorId?: string;
  authorName?: string;
}

function loadAnnouncements(): Announcement[] {
  try {
    if (!fs.existsSync(FILE)) return [];
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as Announcement[];
  } catch {
    return [];
  }
}

function saveAnnouncements(announcements: Announcement[]) {
  fs.writeFileSync(FILE, JSON.stringify(announcements, null, 2), "utf8");
}

export function getAnnouncements(): Announcement[] {
  return loadAnnouncements();
}

export function getActiveAnnouncements(): Announcement[] {
  return loadAnnouncements().filter(a => a.isActive);
}

export function createAnnouncement(data: Omit<Announcement, "id" | "createdAt" | "updatedAt">): Announcement {
  const announcements = loadAnnouncements();
  const now = new Date().toISOString();
  const newAnnouncement: Announcement = {
    ...data,
    id: Date.now().toString(),
    createdAt: now,
    updatedAt: now,
  };
  announcements.unshift(newAnnouncement); // Add to beginning
  saveAnnouncements(announcements);
  return newAnnouncement;
}

export function updateAnnouncement(id: string, data: Partial<Omit<Announcement, "id" | "createdAt" | "updatedAt">>): Announcement | null {
  const announcements = loadAnnouncements();
  const index = announcements.findIndex(a => a.id === id);
  if (index === -1) return null;
  
  announcements[index] = {
    ...announcements[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  saveAnnouncements(announcements);
  return announcements[index];
}

export function deleteAnnouncement(id: string): boolean {
  const announcements = loadAnnouncements();
  const initialLength = announcements.length;
  const filtered = announcements.filter(a => a.id !== id);
  saveAnnouncements(filtered);
  return filtered.length !== initialLength;
}
