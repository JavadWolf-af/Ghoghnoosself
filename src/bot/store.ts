import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

// ── Persistence ───────────────────────────────────────────────────
const DATA_DIR  = resolve(process.env["DATA_DIR"] ?? "./data");
const DATA_FILE = resolve(DATA_DIR, "db.json");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

interface PersistedData {
  users: Record<number, UserRecord>;
  tokens: Record<string, TokenRecord>;
  balanceRequests: Record<string, BalanceRequest>;
  cardNumber: string;
}

function loadData(): PersistedData {
  ensureDataDir();
  if (!existsSync(DATA_FILE)) return { users: {}, tokens: {}, balanceRequests: {}, cardNumber: "" };
  try {
    const raw = JSON.parse(readFileSync(DATA_FILE, "utf8")) as PersistedData;
    // revive Date objects
    for (const u of Object.values(raw.users ?? {})) {
      u.joinedAt = new Date(u.joinedAt);
      if (u.activatedAt) u.activatedAt = new Date(u.activatedAt);
    }
    for (const t of Object.values(raw.tokens ?? {})) {
      t.createdAt = new Date(t.createdAt);
      if (t.usedAt) t.usedAt = new Date(t.usedAt);
    }
    for (const r of Object.values(raw.balanceRequests ?? {})) {
      r.requestedAt = new Date(r.requestedAt);
    }
    return raw;
  } catch { return { users: {}, tokens: {}, balanceRequests: {}, cardNumber: "" }; }
}

function saveData() {
  ensureDataDir();
  const data: PersistedData = {
    users: Object.fromEntries(users) as Record<number, UserRecord>,
    tokens: Object.fromEntries(tokens) as Record<string, TokenRecord>,
    balanceRequests: Object.fromEntries(balanceRequests) as Record<string, BalanceRequest>,
    cardNumber,
  };
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

// ── Types ─────────────────────────────────────────────────────────
export interface UserRecord {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  joinedAt: Date;
  isActivated: boolean;
  activatedAt?: Date;
  balance: number;
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

// ── Load persisted data ───────────────────────────────────────────
const persisted = loadData();

const users           = new Map<number, UserRecord>(Object.entries(persisted.users).map(([k, v]) => [Number(k), v]));
const tokens          = new Map<string, TokenRecord>(Object.entries(persisted.tokens));
const balanceRequests = new Map<string, BalanceRequest>(Object.entries(persisted.balanceRequests));
let cardNumber        = persisted.cardNumber ?? "";

// ── Helpers ───────────────────────────────────────────────────────
function generateReferralCode(userId: number): string { return `REF${userId}`; }

function generateId(): string { return Math.random().toString(36).slice(2, 10).toUpperCase(); }

function generateTokenCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part  = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `SALF-${part()}-${part()}`;
}

// ── Users ─────────────────────────────────────────────────────────
export function addUser(user: {
  id: number; firstName: string; lastName?: string; username?: string; referredBy?: number;
}): void {
  if (!users.has(user.id)) {
    users.set(user.id, {
      ...user, joinedAt: new Date(), isActivated: false,
      balance: 0, referralCode: generateReferralCode(user.id), referralCount: 0,
    });
    if (user.referredBy && users.has(user.referredBy)) {
      users.get(user.referredBy)!.referralCount += 1;
    }
    saveData();
  } else {
    // update name in case it changed
    const u = users.get(user.id)!;
    u.firstName = user.firstName;
    if (user.lastName !== undefined) u.lastName = user.lastName;
    if (user.username !== undefined) u.username = user.username;
    saveData();
  }
}

export function getUser(userId: number): UserRecord | undefined { return users.get(userId); }
export function getAllUsers(): UserRecord[] { return Array.from(users.values()); }
export function getUserCount(): number { return users.size; }
export function isUserActivated(userId: number): boolean { return users.get(userId)?.isActivated ?? false; }

export function activateUser(userId: number): void {
  const u = users.get(userId);
  if (u) { u.isActivated = true; u.activatedAt = new Date(); saveData(); }
}

export function getUserBalance(userId: number): number { return users.get(userId)?.balance ?? 0; }

export function addBalance(userId: number, amount: number): boolean {
  const u = users.get(userId);
  if (!u) return false;
  u.balance += amount;
  saveData();
  return true;
}

export function deductBalance(userId: number, amount: number): boolean {
  const u = users.get(userId);
  if (!u || u.balance < amount) return false;
  u.balance -= amount;
  saveData();
  return true;
}

// ── Tokens ────────────────────────────────────────────────────────
export function createToken(adminId: number): string {
  let code = generateTokenCode();
  while (tokens.has(code)) code = generateTokenCode();
  tokens.set(code, { code, createdByAdminId: adminId, createdAt: new Date(), isUsed: false });
  saveData();
  return code;
}

export function validateAndUseToken(
  code: string, userId: number
): { valid: boolean; reason?: string } {
  const norm  = code.trim().toUpperCase();
  const token = tokens.get(norm);
  if (!token) return { valid: false, reason: "not_found" };
  if (token.isUsed) return { valid: false, reason: "already_used" };
  token.isUsed = true; token.usedByUserId = userId; token.usedAt = new Date();
  activateUser(userId);
  saveData();
  return { valid: true };
}

export function getTokenCount(): number { return tokens.size; }
export function getUnusedTokenCount(): number { return Array.from(tokens.values()).filter((t) => !t.isUsed).length; }

// ── Balance Requests ──────────────────────────────────────────────
export function createBalanceRequest(userId: number, amount: number): string {
  const id = generateId();
  balanceRequests.set(id, { id, userId, amount, requestedAt: new Date(), status: "pending" });
  saveData();
  return id;
}

export function getPendingBalanceRequests(): BalanceRequest[] {
  return Array.from(balanceRequests.values()).filter((r) => r.status === "pending");
}

export function approveBalanceRequest(requestId: string): { ok: boolean; userId?: number; amount?: number } {
  const req = balanceRequests.get(requestId);
  if (!req || req.status !== "pending") return { ok: false };
  req.status = "approved";
  addBalance(req.userId, req.amount);
  saveData();
  return { ok: true, userId: req.userId, amount: req.amount };
}

export function rejectBalanceRequest(requestId: string): boolean {
  const req = balanceRequests.get(requestId);
  if (!req || req.status !== "pending") return false;
  req.status = "rejected"; saveData();
  return true;
}

// ── Transfers ─────────────────────────────────────────────────────
export function transferBalance(
  fromUserId: number, toUserId: number, amount: number
): { ok: boolean; reason?: string } {
  if (!users.has(toUserId)) return { ok: false, reason: "target_not_found" };
  if (!deductBalance(fromUserId, amount)) return { ok: false, reason: "insufficient_balance" };
  addBalance(toUserId, amount);
  return { ok: true };
}

// ── Card Number ───────────────────────────────────────────────────
export function setCardNumber(card: string): void { cardNumber = card; saveData(); }
export function getCardNumber(): string { return cardNumber; }

// ── Pending states (in-memory only — intentionally not persisted) ─
type PendingSet = "broadcast" | "tokenEntry" | "addBalance" | "transferInput"
  | "cardNumberInput" | "adminTransfer" | "approveSelect";

const SETS: Record<PendingSet, Set<number>> = {
  broadcast:       new Set(),
  tokenEntry:      new Set(),
  addBalance:      new Set(),
  transferInput:   new Set(),
  cardNumberInput: new Set(),
  adminTransfer:   new Set(),
  approveSelect:   new Set(),
};

export function setPending(userId: number, state: PendingSet): void {
  clearAllPending(userId);
  SETS[state].add(userId);
}

export function clearAllPending(userId: number): void {
  for (const s of Object.values(SETS)) s.delete(userId);
}

export function isPending(userId: number, state: PendingSet): boolean {
  return SETS[state].has(userId);
}
