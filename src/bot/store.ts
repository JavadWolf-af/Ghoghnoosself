import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const DATA_DIR  = resolve(process.env["DATA_DIR"] ?? "./data");
const DATA_FILE = resolve(DATA_DIR, "db.json");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export interface UserRecord {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  joinedAt: Date;
  isActivated: boolean;
  activatedAt?: Date;
  balance: number;
  isBlocked: boolean;
  referredBy?: number;
  referralCode: string;
  referralCount: number;
}

export interface TokenRecord {
  code: string;
  createdByAdminId: number;
  createdAt: Date;
  isUsed: boolean;
  usedByUserId?: number;
  usedAt?: Date;
}

export interface BalanceRequest {
  id: string;
  userId: number;
  amount: number;
  requestedAt: Date;
  status: "pending" | "approved" | "rejected";
}

export interface TicketMessage {
  from: "user" | "admin";
  text: string;
  at: Date;
}

export interface SupportTicket {
  id: string;
  userId: number;
  status: "open" | "closed";
  createdAt: Date;
  messages: TicketMessage[];
  lastReminderAt?: Date;
}

interface PersistedData {
  users: Record<number, UserRecord>;
  tokens: Record<string, TokenRecord>;
  balanceRequests: Record<string, BalanceRequest>;
  tickets: Record<string, SupportTicket>;
  cardNumber: string;
}

function loadData(): PersistedData {
  ensureDataDir();
  if (!existsSync(DATA_FILE)) return { users: {}, tokens: {}, balanceRequests: {}, tickets: {}, cardNumber: "" };
  try {
    const raw = JSON.parse(readFileSync(DATA_FILE, "utf8")) as PersistedData;
    for (const u of Object.values(raw.users ?? {})) {
      u.joinedAt = new Date(u.joinedAt);
      if (u.activatedAt) u.activatedAt = new Date(u.activatedAt);
      if (u.isBlocked === undefined) u.isBlocked = false;
    }
    for (const t of Object.values(raw.tokens ?? {})) {
      t.createdAt = new Date(t.createdAt);
      if (t.usedAt) t.usedAt = new Date(t.usedAt);
    }
    for (const r of Object.values(raw.balanceRequests ?? {})) {
      r.requestedAt = new Date(r.requestedAt);
    }
    for (const tk of Object.values(raw.tickets ?? {})) {
      tk.createdAt = new Date(tk.createdAt);
      tk.messages = (tk.messages ?? []).map(m => ({ ...m, at: new Date(m.at) }));
      if (tk.lastReminderAt) tk.lastReminderAt = new Date(tk.lastReminderAt);
    }
    return { ...raw, tickets: raw.tickets ?? {} };
  } catch { return { users: {}, tokens: {}, balanceRequests: {}, tickets: {}, cardNumber: "" }; }
}

function saveData() {
  ensureDataDir();
  const data: PersistedData = {
    users: Object.fromEntries(users) as Record<number, UserRecord>,
    tokens: Object.fromEntries(tokens) as Record<string, TokenRecord>,
    balanceRequests: Object.fromEntries(balanceRequests) as Record<string, BalanceRequest>,
    tickets: Object.fromEntries(ticketsMap) as Record<string, SupportTicket>,
    cardNumber,
  };
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

const persisted = loadData();
const users           = new Map<number, UserRecord>(Object.entries(persisted.users).map(([k, v]) => [Number(k), v]));
const tokens          = new Map<string, TokenRecord>(Object.entries(persisted.tokens));
const balanceRequests = new Map<string, BalanceRequest>(Object.entries(persisted.balanceRequests));
const ticketsMap      = new Map<string, SupportTicket>(Object.entries(persisted.tickets ?? {}));
let cardNumber        = persisted.cardNumber ?? "";

function generateReferralCode(userId: number): string { return `REF${userId}`; }

function generateShortId(prefix = ""): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part  = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${prefix}${part()}`;
}

function generateTokenCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part  = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `SALF-${part()}-${part()}`;
}

// ── Users ─────────────────────────────────────────────────────────────────────
export function addUser(user: {
  id: number; firstName: string; lastName?: string; username?: string; referredBy?: number;
}): void {
  if (!users.has(user.id)) {
    users.set(user.id, {
      ...user, joinedAt: new Date(), isActivated: false, isBlocked: false,
      balance: 0, referralCode: generateReferralCode(user.id), referralCount: 0,
    });
    if (user.referredBy && users.has(user.referredBy)) {
      users.get(user.referredBy)!.referralCount += 1;
    }
    saveData();
  } else {
    const u = users.get(user.id)!;
    u.firstName = user.firstName;
    if (user.lastName !== undefined) u.lastName = user.lastName;
    if (user.username !== undefined) u.username = user.username;
    saveData();
  }
}

export function getUser(userId: number): UserRecord | undefined { return users.get(userId); }
export function getAllUsers(): UserRecord[] { return Array.from(users.values()); }
export function getBlockedUsers(): UserRecord[] { return Array.from(users.values()).filter(u => u.isBlocked); }
export function getUserCount(): number { return users.size; }
export function isUserActivated(userId: number): boolean { return users.get(userId)?.isActivated ?? false; }
export function isUserBlocked(userId: number): boolean { return users.get(userId)?.isBlocked ?? false; }

export function activateUser(userId: number): void {
  const u = users.get(userId);
  if (u) { u.isActivated = true; u.activatedAt = new Date(); saveData(); }
}

export function blockUser(userId: number): boolean {
  const u = users.get(userId);
  if (!u) return false;
  u.isBlocked = true; saveData(); return true;
}

export function unblockUser(userId: number): boolean {
  const u = users.get(userId);
  if (!u) return false;
  u.isBlocked = false; saveData(); return true;
}

export function getUserBalance(userId: number): number { return users.get(userId)?.balance ?? 0; }

export function addBalance(userId: number, amount: number): boolean {
  const u = users.get(userId);
  if (!u) return false;
  u.balance += amount; saveData(); return true;
}

export function deductBalance(userId: number, amount: number): boolean {
  const u = users.get(userId);
  if (!u || u.balance < amount) return false;
  u.balance -= amount; saveData(); return true;
}

// ── Tokens ────────────────────────────────────────────────────────────────────
export function createToken(adminId: number): string {
  let code = generateTokenCode();
  while (tokens.has(code)) code = generateTokenCode();
  tokens.set(code, { code, createdByAdminId: adminId, createdAt: new Date(), isUsed: false });
  saveData(); return code;
}

export function validateAndUseToken(code: string, userId: number): { valid: boolean; reason?: string } {
  const norm  = code.trim().toUpperCase();
  const token = tokens.get(norm);
  if (!token) return { valid: false, reason: "not_found" };
  if (token.isUsed) return { valid: false, reason: "already_used" };
  token.isUsed = true; token.usedByUserId = userId; token.usedAt = new Date();
  activateUser(userId); saveData(); return { valid: true };
}

export function getTokenCount(): number { return tokens.size; }
export function getUnusedTokenCount(): number { return Array.from(tokens.values()).filter((t) => !t.isUsed).length; }

// ── Balance Requests ──────────────────────────────────────────────────────────
export function createBalanceRequest(userId: number, amount: number): string {
  let id = generateShortId();
  while (balanceRequests.has(id)) id = generateShortId();
  balanceRequests.set(id, { id, userId, amount, requestedAt: new Date(), status: "pending" });
  saveData(); return id;
}

export function getBalanceRequest(id: string): BalanceRequest | undefined { return balanceRequests.get(id); }

export function approveBalanceRequest(requestId: string): { ok: boolean; userId?: number; amount?: number } {
  const req = balanceRequests.get(requestId);
  if (!req || req.status !== "pending") return { ok: false };
  req.status = "approved"; addBalance(req.userId, req.amount); saveData();
  return { ok: true, userId: req.userId, amount: req.amount };
}

export function rejectBalanceRequest(requestId: string): boolean {
  const req = balanceRequests.get(requestId);
  if (!req || req.status !== "pending") return false;
  req.status = "rejected"; saveData(); return true;
}

export function transferBalance(
  fromUserId: number, toUserId: number, amount: number
): { ok: boolean; reason?: string } {
  if (!users.has(toUserId)) return { ok: false, reason: "target_not_found" };
  if (!deductBalance(fromUserId, amount)) return { ok: false, reason: "insufficient_balance" };
  addBalance(toUserId, amount); return { ok: true };
}

// ── Support Tickets ───────────────────────────────────────────────────────────
export function createSupportTicket(userId: number, text: string): SupportTicket {
  let id = generateShortId("TK");
  while (ticketsMap.has(id)) id = generateShortId("TK");
  const ticket: SupportTicket = {
    id, userId, status: "open", createdAt: new Date(),
    messages: [{ from: "user", text, at: new Date() }],
  };
  ticketsMap.set(id, ticket);
  saveData(); return ticket;
}

export function getOpenTicketByUser(userId: number): SupportTicket | undefined {
  return Array.from(ticketsMap.values()).find(t => t.userId === userId && t.status === "open");
}

export function getSupportTicket(id: string): SupportTicket | undefined {
  return ticketsMap.get(id);
}

export function addTicketMessage(ticketId: string, from: "user" | "admin", text: string): boolean {
  const ticket = ticketsMap.get(ticketId);
  if (!ticket) return false;
  ticket.messages.push({ from, text, at: new Date() });
  saveData(); return true;
}

export function closeSupportTicket(ticketId: string): boolean {
  const ticket = ticketsMap.get(ticketId);
  if (!ticket || ticket.status === "closed") return false;
  ticket.status = "closed";
  saveData(); return true;
}

export function getOpenTicketsCount(): number {
  return Array.from(ticketsMap.values()).filter(t => t.status === "open").length;
}

export function findUserByUsername(username: string): UserRecord | undefined {
  const q = username.replace(/^@/, "").toLowerCase();
  return Array.from(users.values()).find(u => u.username?.toLowerCase() === q);
}

export function getAllOpenTickets(): SupportTicket[] {
  return Array.from(ticketsMap.values())
    .filter(t => t.status === "open")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

// ── Card Number ───────────────────────────────────────────────────────────────
export function setCardNumber(card: string): void { cardNumber = card; saveData(); }
export function getCardNumber(): string { return cardNumber; }

// ── Pending States ────────────────────────────────────────────────────────────
type PendingSet =
  | "broadcast" | "tokenEntry" | "addBalance" | "transferInput"
  | "cardNumberInput" | "adminTransfer" | "adminAddBalance" | "adminAddBalanceAmount"
  | "adminMessageUser" | "support" | "blockedSupport" | "ticketReply" | "adminSearchUser";

const SETS: Record<PendingSet, Set<number>> = {
  broadcast: new Set(), tokenEntry: new Set(), addBalance: new Set(),
  transferInput: new Set(), cardNumberInput: new Set(), adminTransfer: new Set(),
  adminAddBalance: new Set(), adminAddBalanceAmount: new Set(), adminMessageUser: new Set(),
  support: new Set(), blockedSupport: new Set(), ticketReply: new Set(),
  adminSearchUser: new Set(),
};

const addBalanceData     = new Map<number, { amount: number; receiptId: string }>();
const adminBalanceTarget = new Map<number, number>();
const adminMessageTarget = new Map<number, number>();
const adminTicketTarget  = new Map<number, string>(); // adminId -> ticketId

export function setPending(userId: number, state: PendingSet): void {
  clearAllPending(userId); SETS[state].add(userId);
}

export function clearAllPending(userId: number): void {
  for (const s of Object.values(SETS)) s.delete(userId);
  addBalanceData.delete(userId);
  adminBalanceTarget.delete(userId);
  adminMessageTarget.delete(userId);
  adminTicketTarget.delete(userId);
}

export function isPending(userId: number, state: PendingSet): boolean { return SETS[state].has(userId); }

export function isPendingWallet(userId: number): boolean {
  return SETS["addBalance"].has(userId) || SETS["transferInput"].has(userId);
}

export function isPendingAdminManage(userId: number): boolean {
  return SETS["broadcast"].has(userId)
    || SETS["cardNumberInput"].has(userId)
    || SETS["adminTransfer"].has(userId)
    || SETS["adminAddBalance"].has(userId)
    || SETS["adminAddBalanceAmount"].has(userId)
    || SETS["adminMessageUser"].has(userId)
    || SETS["ticketReply"].has(userId)
    || SETS["adminSearchUser"].has(userId);
}

export function setAddBalanceData(userId: number, amount: number, receiptId: string): void {
  addBalanceData.set(userId, { amount, receiptId });
}
export function getAddBalanceData(userId: number): { amount: number; receiptId: string } | undefined {
  return addBalanceData.get(userId);
}
export function setAdminBalanceTarget(adminId: number, targetUserId: number): void {
  adminBalanceTarget.set(adminId, targetUserId);
}
export function getAdminBalanceTarget(adminId: number): number | undefined { return adminBalanceTarget.get(adminId); }
export function setAdminMessageTarget(adminId: number, targetUserId: number): void {
  adminMessageTarget.set(adminId, targetUserId);
}
export function getAdminMessageTarget(adminId: number): number | undefined { return adminMessageTarget.get(adminId); }
export function setAdminTicketTarget(adminId: number, ticketId: string): void {
  adminTicketTarget.set(adminId, ticketId);
}
export function getAdminTicketTarget(adminId: number): string | undefined { return adminTicketTarget.get(adminId); }

// ── Ticket Reminders ──────────────────────────────────────────────────────────

/**
 * بازگرداندن تیکت‌هایی که آخرین پیام از کاربر بوده
 * و در مدت thresholdMs پاسخی دریافت نکرده‌اند.
 * همچنین از ارسال یادآوری تکراری جلوگیری می‌کند.
 */
export function getTicketsNeedingReminder(thresholdMs: number): SupportTicket[] {
  const now = Date.now();
  const result: SupportTicket[] = [];
  for (const ticket of ticketsMap.values()) {
    if (ticket.status !== "open") continue;
    if (ticket.messages.length === 0) continue;
    const lastMsg = ticket.messages[ticket.messages.length - 1]!;
    if (lastMsg.from !== "user") continue;
    const timeSinceLastMsg = now - lastMsg.at.getTime();
    if (timeSinceLastMsg < thresholdMs) continue;
    // اگر قبلاً یادآوری فرستاده شده، تا یک بازه دیگر صبر می‌کنیم
    if (ticket.lastReminderAt) {
      const timeSinceReminder = now - ticket.lastReminderAt.getTime();
      if (timeSinceReminder < thresholdMs) continue;
    }
    result.push(ticket);
  }
  return result;
}

export function markTicketReminded(ticketId: string): void {
  const ticket = ticketsMap.get(ticketId);
  if (ticket) { ticket.lastReminderAt = new Date(); saveData(); }
}
