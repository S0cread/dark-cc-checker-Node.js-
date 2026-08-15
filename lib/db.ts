import fs from "fs";
import path from "path";

function readJson(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
}

export type UserRole = "super_admin" | "mini_admin" | "user";
export type Membership = "free" | "pro" | "team" | "enterprise";
export type UserPermissions = "none" | "checker" | "full";

export interface DbUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  balance: number;
  membership: Membership;
  permissions: UserPermissions;
  avatar?: string;
  createdAt: string;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  crypto: string;
  address: string;
  amount: number;
  txHash: string;
  status: "pending" | "approved" | "rejected";
  plan: string;
  createdAt: string;
  updatedAt: string;
}

function getUsersPath() { return path.join(process.cwd(), "data", "users.json"); }
function getPaymentsPath() { return path.join(process.cwd(), "data", "payments.json"); }

export function getUsers(): DbUser[] {
  return JSON.parse(readJson(getUsersPath())) as DbUser[];
}

export function saveUsers(users: DbUser[]): void {
  fs.writeFileSync(getUsersPath(), JSON.stringify(users, null, 2), "utf-8");
}

export function getUserById(id: string): DbUser | undefined {
  return getUsers().find((u) => u.id === id);
}

export function getUserByEmail(email: string): DbUser | undefined {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function updateUser(id: string, data: Omit<Partial<DbUser>, "id">): DbUser | null {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  const current = users[idx];
  if (!current) return null;
  users[idx] = { ...current, ...data } as DbUser;
  saveUsers(users);
  return users[idx] ?? null;
}

export function getPayments(): PaymentRequest[] {
  return JSON.parse(readJson(getPaymentsPath())) as PaymentRequest[];
}

export function savePayments(payments: PaymentRequest[]): void {
  fs.writeFileSync(getPaymentsPath(), JSON.stringify(payments, null, 2), "utf-8");
}

export interface MarketCard {
  id: string;
  bin: string;
  country: string;
  countryCode: string;
  bank: string;
  cardHolder: string;
  level: string;
  type: string;
  brand: string;
  seller: string;
  month: string;
  year: string;
  price: number;
  hasCvv: boolean;
  hasRefund: boolean;
  extraInfo: string;
  sold: boolean;
  cardNumber: string | null;
  cvv: string | null;
}

export interface Purchase {
  id: string;
  userId: string;
  cardId: string;
  cardNumber: string;
  cvv: string;
  month: string;
  year: string;
  bin: string;
  bank: string;
  cardHolder: string;
  pricePaid: number;
  checkStatus: "unchecked" | "live" | "dead";
  createdAt: string;
}

function getMarketPath() { return path.join(process.cwd(), "data", "market.json"); }
function getPurchasesPath() { return path.join(process.cwd(), "data", "purchases.json"); }

export function getMarketCards(): MarketCard[] {
  return JSON.parse(readJson(getMarketPath())) as MarketCard[];
}
export function saveMarketCards(cards: MarketCard[]): void {
  fs.writeFileSync(getMarketPath(), JSON.stringify(cards, null, 2), "utf-8");
}
export function getPurchases(): Purchase[] {
  return JSON.parse(readJson(getPurchasesPath())) as Purchase[];
}
export function savePurchases(p: Purchase[]): void {
  fs.writeFileSync(getPurchasesPath(), JSON.stringify(p, null, 2), "utf-8");
}

export function addPayment(payment: PaymentRequest): void {
  const payments = getPayments();
  payments.push(payment);
  savePayments(payments);
}

export function updatePayment(id: string, data: Omit<Partial<PaymentRequest>, "id">): PaymentRequest | null {
  const payments = getPayments();
  const idx = payments.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const current = payments[idx];
  if (!current) return null;
  payments[idx] = { ...current, ...data } as PaymentRequest;
  savePayments(payments);
  return payments[idx] ?? null;
}

// ── Tickets ──────────────────────────────────────────────────────────────────

export type TicketStatus = "open" | "in_progress" | "closed";
export type TicketCategory = "genel" | "odeme" | "teknik" | "hesap" | "diger";

export interface Ticket {
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

function getTicketsPath() { return path.join(process.cwd(), "data", "tickets.json"); }

export function getTickets(): Ticket[] {
  return JSON.parse(readJson(getTicketsPath())) as Ticket[];
}
export function saveTickets(tickets: Ticket[]): void {
  fs.writeFileSync(getTicketsPath(), JSON.stringify(tickets, null, 2), "utf-8");
}
export function addTicket(ticket: Ticket): void {
  const tickets = getTickets();
  tickets.push(ticket);
  saveTickets(tickets);
}
export function updateTicket(id: string, data: Partial<Omit<Ticket, "id">>): Ticket | null {
  const tickets = getTickets();
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const current = tickets[idx]!;
  tickets[idx] = { ...current, ...data, updatedAt: new Date().toISOString() };
  saveTickets(tickets);
  return tickets[idx] ?? null;
}
