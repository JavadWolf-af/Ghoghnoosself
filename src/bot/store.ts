import { eq, and, sql } from "drizzle-orm";
import { db } from "../db/client";
import {
  users, tokens, balanceRequests,
  supportTickets, ticketMessages, settings,
} from "../db/schema";

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

function rowToUser(r: typeof users.$inferSelect): UserRecord {
  return {
    id: r.id, firstName: r.firstName, lastName: r.lastName ?? undefined,
    username: r.username ?? undefined, joinedAt: r.joinedAt,
    isActivated: r.isActivated, activatedAt: r.activatedAt ?? undefined,
    balance: r.balance, isBlocked: r.isBlocked,
    referredBy: r.referredBy ?? undefined,
    referralCode: r.referralCode, referralCount: r.referralCount,
  };
}

async function buildTicket(
  row: typeof supportTickets.$inferSelect,
): Promise<SupportTicket> {
  const msgs = await db
    .select()
    .from(ticketMessages)
    .where(eq(ticketMessages.ticketId, row.id))
    .orderBy(ticketMessages.at);
  return {
    id: row.id, userId: row.userId,
    status: row.status as "open" | "closed",
    createdAt: row.createdAt,
    lastReminderAt: row.lastReminderAt ?? undefined,
    messages: msgs.map(m => ({
      from: m.fromRole as "user" | "admin",
      text: m.text, at: m.at,
    })),
  };
}

// ── Users ─────────────────────────────────────────────────────────────────────
export async function addUser(user: {
  id: number; firstName: string; lastName?: string; username?: string; referredBy?: number;
}): Promise<void> {
  const existing = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (existing.length === 0) {
    await db.insert(users).values({
      id: user.id, firstName: user.firstName,
      lastName: user.lastName ?? null, username: user.username ?? null,
      balance: 0, isActivated: false, isBlocked: false,
      referralCode: generateReferralCode(user.id), referralCount: 0,
      referredBy: user.referredBy ?? null,
    });
    if (user.referredBy) {
      await db
        .update(users)
        .set({ referralCount: sql`${users.referralCount} + 1` })
        .where(eq(users.id, user.referredBy));
    }
  } else {
    await db
      .update(users)
      .set({
        firstName: user.firstName,
        lastName: user.lastName ?? null,
        username: user.username ?? null,
      })
      .where(eq(users.id, user.id));
  }
}

export async function getUser(userId: number): Promise<UserRecord | undefined> {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return rows[0] ? rowToUser(rows[0]) : undefined;
}

export async function getAllUsers(): Promise<UserRecord[]> {
  const rows = await db.select().from(users);
  return rows.map(rowToUser);
}

export async function getBlockedUsers(): Promise<UserRecord[]> {
  const rows = await db.select().from(users).where(eq(users.isBlocked, true));
  return rows.map(rowToUser);
}

export async function getUserCount(): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)` }).from(users);
  return Number(row?.count ?? 0);
}

export async function isUserActivated(userId: number): Promise<boolean> {
  const rows = await db.select({ isActivated: users.isActivated }).from(users).where(eq(users.id, userId)).limit(1);
  return rows[0]?.isActivated ?? false;
}

export async function isUserBlocked(userId: number): Promise<boolean> {
  const rows = await db.select({ isBlocked: users.isBlocked }).from(users).where(eq(users.id, userId)).limit(1);
  return rows[0]?.isBlocked ?? false;
}

export async function activateUser(userId: number): Promise<void> {
  await db.update(users).set({ isActivated: true, activatedAt: new Date() }).where(eq(users.id, userId));
}

export async function blockUser(userId: number): Promise<boolean> {
  const result = await db.update(users).set({ isBlocked: true }).where(eq(users.id, userId));
  return (result as unknown as { rowCount?: number })?.rowCount !== 0;
}

export async function unblockUser(userId: number): Promise<boolean> {
  const result = await db.update(users).set({ isBlocked: false }).where(eq(users.id, userId));
  return (result as unknown as { rowCount?: number })?.rowCount !== 0;
}

export async function getUserBalance(userId: number): Promise<number> {
  const rows = await db.select({ balance: users.balance }).from(users).where(eq(users.id, userId)).limit(1);
  return rows[0]?.balance ?? 0;
}

export async function addBalance(userId: number, amount: number): Promise<boolean> {
  const result = await db
    .update(users)
    .set({ balance: sql`${users.balance} + ${amount}` })
    .where(eq(users.id, userId));
  return (result as unknown as { rowCount?: number })?.rowCount !== 0;
}

export async function deductBalance(userId: number, amount: number): Promise<boolean> {
  const result = await db
    .update(users)
    .set({ balance: sql`${users.balance} - ${amount}` })
    .where(and(eq(users.id, userId), sql`${users.balance} >= ${amount}`));
  return (result as unknown as { rowCount?: number })?.rowCount !== 0;
}

// ── Tokens ────────────────────────────────────────────────────────────────────
export async function createToken(adminId: number): Promise<string> {
  let code = generateTokenCode();
  while (true) {
    const existing = await db.select().from(tokens).where(eq(tokens.code, code)).limit(1);
    if (existing.length === 0) break;
    code = generateTokenCode();
  }
  await db.insert(tokens).values({ code, createdByAdminId: adminId, isUsed: false });
  return code;
}

export async function validateAndUseToken(
  code: string, userId: number,
): Promise<{ valid: boolean; reason?: string }> {
  const norm = code.trim().toUpperCase();
  const rows = await db.select().from(tokens).where(eq(tokens.code, norm)).limit(1);
  if (rows.length === 0) return { valid: false, reason: "not_found" };
  const token = rows[0]!;
  if (token.isUsed) return { valid: false, reason: "already_used" };
  await db.update(tokens).set({ isUsed: true, usedByUserId: userId, usedAt: new Date() }).where(eq(tokens.code, norm));
  await activateUser(userId);
  return { valid: true };
}

export async function getTokenCount(): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)` }).from(tokens);
  return Number(row?.count ?? 0);
}

export async function getUnusedTokenCount(): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)` }).from(tokens).where(eq(tokens.isUsed, false));
  return Number(row?.count ?? 0);
}

// ── Balance Requests ──────────────────────────────────────────────────────────
export async function createBalanceRequest(userId: number, amount: number): Promise<string> {
  let id = generateShortId();
  while (true) {
    const existing = await db.select().from(balanceRequests).where(eq(balanceRequests.id, id)).limit(1);
    if (existing.length === 0) break;
    id = generateShortId();
  }
  await db.insert(balanceRequests).values({ id, userId, amount, status: "pending" });
  return id;
}

export async function getBalanceRequest(id: string): Promise<BalanceRequest | undefined> {
  const rows = await db.select().from(balanceRequests).where(eq(balanceRequests.id, id)).limit(1);
  if (!rows[0]) return undefined;
  const r = rows[0];
  return { id: r.id, userId: r.userId, amount: r.amount, requestedAt: r.requestedAt, status: r.status as BalanceRequest["status"] };
}

export async function approveBalanceRequest(requestId: string): Promise<{ ok: boolean; userId?: number; amount?: number }> {
  const req = await getBalanceRequest(requestId);
  if (!req || req.status !== "pending") return { ok: false };
  await db.update(balanceRequests).set({ status: "approved" }).where(eq(balanceRequests.id, requestId));
  await addBalance(req.userId, req.amount);
  return { ok: true, userId: req.userId, amount: req.amount };
}

export async function rejectBalanceRequest(requestId: string): Promise<boolean> {
  const req = await getBalanceRequest(requestId);
  if (!req || req.status !== "pending") return false;
  await db.update(balanceRequests).set({ status: "rejected" }).where(eq(balanceRequests.id, requestId));
  return true;
}

export async function transferBalance(
  fromUserId: number, toUserId: number, amount: number,
): Promise<{ ok: boolean; reason?: string }> {
  const toExists = await db.select({ id: users.id }).from(users).where(eq(users.id, toUserId)).limit(1);
  if (toExists.length === 0) return { ok: false, reason: "target_not_found" };
  const deducted = await deductBalance(fromUserId, amount);
  if (!deducted) return { ok: false, reason: "insufficient_balance" };
  await addBalance(toUserId, amount);
  return { ok: true };
}

// ── Support Tickets ───────────────────────────────────────────────────────────
export async function createSupportTicket(userId: number, text: string): Promise<SupportTicket> {
  let id = generateShortId("TK");
  while (true) {
    const existing = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
    if (existing.length === 0) break;
    id = generateShortId("TK");
  }
  const now = new Date();
  await db.insert(supportTickets).values({ id, userId, status: "open", createdAt: now });
  await db.insert(ticketMessages).values({ ticketId: id, fromRole: "user", text, at: now });
  return {
    id, userId, status: "open", createdAt: now,
    messages: [{ from: "user", text, at: now }],
  };
}

export async function getOpenTicketByUser(userId: number): Promise<SupportTicket | undefined> {
  const rows = await db.select().from(supportTickets)
    .where(and(eq(supportTickets.userId, userId), eq(supportTickets.status, "open")))
    .limit(1);
  if (!rows[0]) return undefined;
  return buildTicket(rows[0]);
}

export async function getSupportTicket(id: string): Promise<SupportTicket | undefined> {
  const rows = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
  if (!rows[0]) return undefined;
  return buildTicket(rows[0]);
}

export async function addTicketMessage(ticketId: string, from: "user" | "admin", text: string): Promise<boolean> {
  const rows = await db.select({ id: supportTickets.id }).from(supportTickets).where(eq(supportTickets.id, ticketId)).limit(1);
  if (!rows[0]) return false;
  await db.insert(ticketMessages).values({ ticketId, fromRole: from, text, at: new Date() });
  return true;
}

export async function closeSupportTicket(ticketId: string): Promise<boolean> {
  const rows = await db.select().from(supportTickets).where(and(eq(supportTickets.id, ticketId), eq(supportTickets.status, "open"))).limit(1);
  if (!rows[0]) return false;
  await db.update(supportTickets).set({ status: "closed" }).where(eq(supportTickets.id, ticketId));
  return true;
}

export async function getOpenTicketsCount(): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)` }).from(supportTickets).where(eq(supportTickets.status, "open"));
  return Number(row?.count ?? 0);
}

export async function findUserByUsername(username: string): Promise<UserRecord | undefined> {
  const q = username.replace(/^@/, "").toLowerCase();
  const rows = await db.select().from(users).where(sql`LOWER(${users.username}) = ${q}`).limit(1);
  return rows[0] ? rowToUser(rows[0]) : undefined;
}

export async function getAllOpenTickets(): Promise<SupportTicket[]> {
  const rows = await db.select().from(supportTickets)
    .where(eq(supportTickets.status, "open"))
    .orderBy(supportTickets.createdAt);
  return Promise.all(rows.map(buildTicket));
}

// ── Card Number ───────────────────────────────────────────────────────────────
let _cardNumber: string | null = null;

export async function getCardNumber(): Promise<string> {
  if (_cardNumber !== null) return _cardNumber;
  const rows = await db.select().from(settings).where(eq(settings.key, "card_number")).limit(1);
  _cardNumber = rows[0]?.value ?? "";
  return _cardNumber;
}

export async function setCardNumber(card: string): Promise<void> {
  _cardNumber = card;
  await db.insert(settings).values({ key: "card_number", value: card })
    .onConflictDoUpdate({ target: settings.key, set: { value: card } });
}

// ── Ticket Reminders ──────────────────────────────────────────────────────────
export async function getTicketsNeedingReminder(thresholdMs: number): Promise<SupportTicket[]> {
  const rows = await db.select().from(supportTickets)
    .where(eq(supportTickets.status, "open"))
    .orderBy(supportTickets.createdAt);
  const tickets = await Promise.all(rows.map(buildTicket));
  const now = Date.now();
  return tickets.filter(ticket => {
    if (ticket.messages.length === 0) return false;
    const lastMsg = ticket.messages[ticket.messages.length - 1]!;
    if (lastMsg.from !== "user") return false;
    if (now - lastMsg.at.getTime() < thresholdMs) return false;
    if (ticket.lastReminderAt && now - ticket.lastReminderAt.getTime() < thresholdMs) return false;
    return true;
  });
}

export async function markTicketReminded(ticketId: string): Promise<void> {
  await db.update(supportTickets).set({ lastReminderAt: new Date() }).where(eq(supportTickets.id, ticketId));
}

// ── Pending States (in-memory — transient) ────────────────────────────────────
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
const adminTicketTarget  = new Map<number, string>();

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
