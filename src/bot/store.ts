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
  status: "active" | "grace" | "expired";
  graceStartedAt?: Date;
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

// FIX: use .returning() instead of unsafe rowCount cast
export async function blockUser(userId: number): Promise<boolean> {
  const result = await db
    .update(users)
    .set({ isBlocked: true })
    .where(eq(users.id, userId))
    .returning({ id: users.id });
  return result.length > 0;
}

export async function unblockUser(userId: number): Promise<boolean> {
  const result = await db
    .update(users)
    .set({ isBlocked: false })
    .where(eq(users.id, userId))
    .returning({ id: users.id });
  return result.length > 0;
}

export async function getUserBalance(userId: number): Promise<number> {
  const rows = await db.select({ balance: users.balance }).from(users).where(eq(users.id, userId)).limit(1);
  return rows[0]?.balance ?? 0;
}

// FIX: use .returning() instead of unsafe rowCount cast
export async function addBalance(userId: number, amount: number): Promise<boolean> {
  const result = await db
    .update(users)
    .set({ balance: sql`${users.balance} + ${amount}` })
    .where(eq(users.id, userId))
    .returning({ id: users.id });
  return result.length > 0;
}

export async function deductBalance(userId: number, amount: number): Promise<boolean> {
  const result = await db
    .update(users)
    .set({ balance: sql`${users.balance} - ${amount}` })
    .where(and(eq(users.id, userId), sql`${users.balance} >= ${amount}`))
    .returning({ id: users.id });
  return result.length > 0;
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

// FIX: atomic update — prevents double-use race condition
export async function validateAndUseToken(
  code: string, userId: number,
): Promise<{ valid: boolean; reason?: string }> {
  const norm = code.trim().toUpperCase();
  const rows = await db.select().from(tokens).where(eq(tokens.code, norm)).limit(1);
  if (rows.length === 0) return { valid: false, reason: "not_found" };
  if (rows[0]!.isUsed) return { valid: false, reason: "already_used" };

  // Atomic: only succeeds if token is still unused at the moment of update
  const updated = await db
    .update(tokens)
    .set({ isUsed: true, usedByUserId: userId, usedAt: new Date() })
    .where(and(eq(tokens.code, norm), eq(tokens.isUsed, false)))
    .returning({ code: tokens.code });

  if (updated.length === 0) return { valid: false, reason: "already_used" };
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
// FIX: now stores receipt photo file_id for auditability after bot restarts
export async function createBalanceRequest(
  userId: number, amount: number, receiptFileId: string,
): Promise<string> {
  let id = generateShortId();
  // Retry on PK collision (concurrent requests with same generated ID)
  while (true) {
    try {
      await db.insert(balanceRequests).values({ id, userId, amount, receiptFileId, status: "pending" });
      return id;
    } catch {
      id = generateShortId();
    }
  }
}

export async function getBalanceRequest(id: string): Promise<BalanceRequest | undefined> {
  const rows = await db.select().from(balanceRequests).where(eq(balanceRequests.id, id)).limit(1);
  if (!rows[0]) return undefined;
  const r = rows[0];
  return { id: r.id, userId: r.userId, amount: r.amount, requestedAt: r.requestedAt, status: r.status as BalanceRequest["status"] };
}

// FIX: wrapped in a transaction — prevents double-approval race condition
export async function approveBalanceRequest(requestId: string): Promise<{ ok: boolean; userId?: number; amount?: number }> {
  return db.transaction(async (tx) => {
    // Atomic status update — only succeeds if still pending
    const updated = await tx
      .update(balanceRequests)
      .set({ status: "approved" })
      .where(and(eq(balanceRequests.id, requestId), eq(balanceRequests.status, "pending")))
      .returning({ userId: balanceRequests.userId, amount: balanceRequests.amount });

    if (updated.length === 0) return { ok: false };
    const { userId, amount } = updated[0]!;

    await tx
      .update(users)
      .set({ balance: sql`${users.balance} + ${amount}` })
      .where(eq(users.id, userId));

    return { ok: true, userId, amount };
  });
}

export async function rejectBalanceRequest(requestId: string): Promise<boolean> {
  const updated = await db
    .update(balanceRequests)
    .set({ status: "rejected" })
    .where(and(eq(balanceRequests.id, requestId), eq(balanceRequests.status, "pending")))
    .returning({ id: balanceRequests.id });
  return updated.length > 0;
}

// FIX: wrapped in a transaction — prevents money loss if server crashes mid-transfer
export async function transferBalance(
  fromUserId: number, toUserId: number, amount: number,
): Promise<{ ok: boolean; reason?: string }> {
  return db.transaction(async (tx) => {
    const toExists = await tx.select({ id: users.id }).from(users).where(eq(users.id, toUserId)).limit(1);
    if (toExists.length === 0) return { ok: false, reason: "target_not_found" };

    const deducted = await tx
      .update(users)
      .set({ balance: sql`${users.balance} - ${amount}` })
      .where(and(eq(users.id, fromUserId), sql`${users.balance} >= ${amount}`))
      .returning({ id: users.id });

    if (deducted.length === 0) return { ok: false, reason: "insufficient_balance" };

    await tx
      .update(users)
      .set({ balance: sql`${users.balance} + ${amount}` })
      .where(eq(users.id, toUserId));

    return { ok: true };
  });
}

// ── Support Tickets ───────────────────────────────────────────────────────────
export async function createSupportTicket(userId: number, text: string): Promise<SupportTicket> {
  let id = generateShortId("TK");
  while (true) {
    try {
      const now = new Date();
      await db.insert(supportTickets).values({ id, userId, status: "open", createdAt: now });
      await db.insert(ticketMessages).values({ ticketId: id, fromRole: "user", text, at: now });
      return {
        id, userId, status: "open", createdAt: now,
        messages: [{ from: "user", text, at: now }],
      };
    } catch {
      id = generateShortId("TK");
    }
  }
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
  const updated = await db
    .update(supportTickets)
    .set({ status: "closed" })
    .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.status, "open")))
    .returning({ id: supportTickets.id });
  return updated.length > 0;
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

// ── Card Info ─────────────────────────────────────────────────────────────────
let _cardNumber: string | null = null;
let _cardHolder: string | null = null;
let _cardBank:   string | null = null;

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

export async function getCardHolder(): Promise<string> {
  if (_cardHolder !== null) return _cardHolder;
  const rows = await db.select().from(settings).where(eq(settings.key, "card_holder")).limit(1);
  _cardHolder = rows[0]?.value ?? "";
  return _cardHolder;
}
export async function setCardHolder(holder: string): Promise<void> {
  _cardHolder = holder;
  await db.insert(settings).values({ key: "card_holder", value: holder })
    .onConflictDoUpdate({ target: settings.key, set: { value: holder } });
}

export async function getCardBank(): Promise<string> {
  if (_cardBank !== null) return _cardBank;
  const rows = await db.select().from(settings).where(eq(settings.key, "card_bank")).limit(1);
  _cardBank = rows[0]?.value ?? "";
  return _cardBank;
}
export async function setCardBank(bank: string): Promise<void> {
  _cardBank = bank;
  await db.insert(settings).values({ key: "card_bank", value: bank })
    .onConflictDoUpdate({ target: settings.key, set: { value: bank } });
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
  | "cardNumberInput" | "cardHolderInput" | "cardBankInput"
  | "adminTransfer" | "adminAddBalance" | "adminAddBalanceAmount"
  | "adminMessageUser" | "support" | "blockedSupport" | "ticketReply" | "adminSearchUser"
  | "tokenCostInput";

const SETS: Record<PendingSet, Set<number>> = {
  broadcast: new Set(), tokenEntry: new Set(), addBalance: new Set(),
  transferInput: new Set(), cardNumberInput: new Set(), cardHolderInput: new Set(),
  cardBankInput: new Set(), adminTransfer: new Set(),
  adminAddBalance: new Set(), adminAddBalanceAmount: new Set(), adminMessageUser: new Set(),
  support: new Set(), blockedSupport: new Set(), ticketReply: new Set(),
  adminSearchUser: new Set(), tokenCostInput: new Set(),
};

const addBalanceData     = new Map<number, { amount: number; receiptId: string }>();
const adminBalanceTarget = new Map<number, number>();
const adminMessageTarget = new Map<number, number>();
const adminTicketTarget  = new Map<number, string>();
const pendingCardNumber  = new Map<number, string>();
const pendingCardHolder  = new Map<number, string>();

export function setPending(userId: number, state: PendingSet): void {
  clearAllPending(userId); SETS[state].add(userId);
}

export function clearAllPending(userId: number): void {
  for (const s of Object.values(SETS)) s.delete(userId);
  addBalanceData.delete(userId);
  adminBalanceTarget.delete(userId);
  adminMessageTarget.delete(userId);
  adminTicketTarget.delete(userId);
  pendingCardNumber.delete(userId);
  pendingCardHolder.delete(userId);
}

export function isPending(userId: number, state: PendingSet): boolean { return SETS[state].has(userId); }

export function isPendingWallet(userId: number): boolean {
  return SETS["addBalance"].has(userId) || SETS["transferInput"].has(userId);
}

export function isPendingAdminManage(userId: number): boolean {
  return SETS["broadcast"].has(userId)
    || SETS["cardNumberInput"].has(userId)
    || SETS["cardHolderInput"].has(userId)
    || SETS["cardBankInput"].has(userId)
    || SETS["adminTransfer"].has(userId)
    || SETS["adminAddBalance"].has(userId)
    || SETS["adminAddBalanceAmount"].has(userId)
    || SETS["adminMessageUser"].has(userId)
    || SETS["ticketReply"].has(userId)
    || SETS["adminSearchUser"].has(userId)
    || SETS["tokenCostInput"].has(userId);
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

export function setPendingCardNumber(adminId: number, card: string): void { pendingCardNumber.set(adminId, card); }
export function getPendingCardNumber(adminId: number): string | undefined { return pendingCardNumber.get(adminId); }
export function setPendingCardHolder(adminId: number, holder: string): void { pendingCardHolder.set(adminId, holder); }
export function getPendingCardHolder(adminId: number): string | undefined { return pendingCardHolder.get(adminId); }

// ── Token Billing ─────────────────────────────────────────────────────────────

export interface BillingNotification {
  userId: number;
  type: "low" | "critical" | "grace_started" | "grace_reminder" | "expired";
  daysLeft?: number;
  tokenCode: string;
}

export interface BillingResult {
  billed: number;
  graceStarted: number;
  expired: number;
  notifications: BillingNotification[];
}

let _tokenDailyCost: number | null = null;

export async function getTokenDailyCost(): Promise<number> {
  if (_tokenDailyCost !== null) return _tokenDailyCost;
  const rows = await db.select().from(settings).where(eq(settings.key, "daily_token_cost")).limit(1);
  _tokenDailyCost = rows[0] ? parseInt(rows[0].value, 10) : 0;
  return _tokenDailyCost;
}

export async function setTokenDailyCost(amount: number): Promise<void> {
  _tokenDailyCost = amount;
  await db.insert(settings).values({ key: "daily_token_cost", value: String(amount) })
    .onConflictDoUpdate({ target: settings.key, set: { value: String(amount) } });
}

function rowToToken(r: typeof tokens.$inferSelect): TokenRecord {
  return {
    code: r.code, createdByAdminId: r.createdByAdminId, createdAt: r.createdAt,
    isUsed: r.isUsed, usedByUserId: r.usedByUserId ?? undefined,
    usedAt: r.usedAt ?? undefined,
    status: (r.status ?? "active") as "active" | "grace" | "expired",
    graceStartedAt: r.graceStartedAt ?? undefined,
  };
}

export async function getTokenByUserId(userId: number): Promise<TokenRecord | undefined> {
  const rows = await db.select().from(tokens).where(eq(tokens.usedByUserId, userId)).limit(1);
  return rows[0] ? rowToToken(rows[0]) : undefined;
}

export async function getActiveTokensWithUsers(): Promise<TokenRecord[]> {
  const rows = await db.select().from(tokens)
    .where(and(eq(tokens.isUsed, true), sql`${tokens.status} != 'expired'`));
  return rows.map(rowToToken);
}

export async function getGraceTokens(): Promise<TokenRecord[]> {
  const rows = await db.select().from(tokens).where(eq(tokens.status, "grace"));
  return rows.map(rowToToken);
}

export async function getActiveTokenCount(): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)` })
    .from(tokens).where(and(eq(tokens.isUsed, true), eq(tokens.status, "active")));
  return Number(row?.count ?? 0);
}

export async function startTokenGracePeriod(code: string): Promise<void> {
  await db.update(tokens)
    .set({ status: "grace", graceStartedAt: new Date() })
    .where(and(eq(tokens.code, code), eq(tokens.status, "active")));
}

export async function expireToken(code: string): Promise<void> {
  await db.update(tokens).set({ status: "expired" }).where(eq(tokens.code, code));
}

export async function restoreTokenFromGrace(code: string): Promise<boolean> {
  const result = await db.update(tokens)
    .set({ status: "active", graceStartedAt: null })
    .where(and(eq(tokens.code, code), eq(tokens.status, "grace")))
    .returning({ code: tokens.code });
  return result.length > 0;
}

const GRACE_DAYS = 10;
const GRACE_MS   = GRACE_DAYS * 24 * 60 * 60 * 1000;

export async function runDailyBilling(): Promise<BillingResult> {
  const dailyCost = await getTokenDailyCost();
  const result: BillingResult = { billed: 0, graceStarted: 0, expired: 0, notifications: [] };
  if (dailyCost <= 0) return result;

  const activeTokens       = await getActiveTokensWithUsers();
  const LOW_THRESHOLD      = dailyCost * 6;  // ~20% of a 30-day billing month
  const CRITICAL_THRESHOLD = dailyCost * 3;  // ~10%

  for (const token of activeTokens) {
    if (!token.usedByUserId) continue;
    const userId = token.usedByUserId;

    if (token.status === "grace") {
      const graceAge = token.graceStartedAt ? Date.now() - token.graceStartedAt.getTime() : GRACE_MS;
      if (graceAge >= GRACE_MS) {
        await expireToken(token.code);
        result.expired++;
        result.notifications.push({ userId, type: "expired", tokenCode: token.code });
      } else {
        const daysLeft = GRACE_DAYS - Math.floor(graceAge / (24 * 60 * 60 * 1000));
        result.notifications.push({ userId, type: "grace_reminder", daysLeft, tokenCode: token.code });
      }
      continue;
    }

    // status === "active": deduct daily cost
    const prevBalance = await getUserBalance(userId);
    const deducted    = await deductBalance(userId, dailyCost);

    if (!deducted) {
      await startTokenGracePeriod(token.code);
      result.graceStarted++;
      result.notifications.push({ userId, type: "grace_started", daysLeft: GRACE_DAYS, tokenCode: token.code });
    } else {
      result.billed++;
      const newBalance = prevBalance - dailyCost;
      // Only warn on threshold crossings so user gets each warning exactly once
      if (prevBalance >= LOW_THRESHOLD && newBalance < LOW_THRESHOLD && newBalance >= CRITICAL_THRESHOLD) {
        result.notifications.push({ userId, type: "low", daysLeft: Math.max(1, Math.floor(newBalance / dailyCost)), tokenCode: token.code });
      } else if (prevBalance >= CRITICAL_THRESHOLD && newBalance < CRITICAL_THRESHOLD) {
        result.notifications.push({ userId, type: "critical", daysLeft: Math.max(1, Math.floor(newBalance / dailyCost)), tokenCode: token.code });
      }
    }
  }
  return result;
}
