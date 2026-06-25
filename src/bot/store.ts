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
  blockedAt?: Date;
}

export interface DepositRequest {
  id: string;
  userId: number;
  amount: number;
  createdAt: Date;
  status: "awaiting_receipt" | "pending_review" | "approved" | "rejected";
  receiptFileId?: string;
  adminMessageId?: number;
  adminChatId?: number;
}

interface TokenRecord {
  code: string;
  createdByAdminId: number;
  createdAt: Date;
  isUsed: boolean;
  usedByUserId?: number;
  usedAt?: Date;
}

const users = new Map<number, UserRecord>();
const tokens = new Map<string, TokenRecord>();
const depositRequests = new Map<string, DepositRequest>();

const pendingBroadcast = new Set<number>();
const pendingTokenEntry = new Set<number>();
const pendingDepositAmount = new Set<number>();
const pendingDepositReceipt = new Map<number, string>();

const pendingAdminBalance = new Set<number>();
const pendingAdminBalanceUserId = new Map<number, number>();
const pendingAdminMessageTo = new Map<number, { userId: number; depositId: string }>();

let depositCounter = 1000;

function generateDepositId(): string {
  return `DEP-${++depositCounter}`;
}

function generateTokenCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () =>
    Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  return `SALF-${part()}-${part()}`;
}

export function addUser(user: {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
}): void {
  if (!users.has(user.id)) {
    users.set(user.id, {
      ...user,
      joinedAt: new Date(),
      isActivated: false,
      balance: 0,
      isBlocked: false,
    });
  }
}

export function getUser(id: number): UserRecord | undefined {
  return users.get(id);
}

export function getAllUsers(): UserRecord[] {
  return Array.from(users.values());
}

export function getUserCount(): number {
  return users.size;
}

export function isUserActivated(userId: number): boolean {
  return users.get(userId)?.isActivated ?? false;
}

export function isUserBlocked(userId: number): boolean {
  return users.get(userId)?.isBlocked ?? false;
}

export function blockUser(userId: number): boolean {
  const user = users.get(userId);
  if (!user) return false;
  user.isBlocked = true;
  user.blockedAt = new Date();
  return true;
}

export function unblockUser(userId: number): boolean {
  const user = users.get(userId);
  if (!user) return false;
  user.isBlocked = false;
  return true;
}

export function getUserBalance(userId: number): number {
  return users.get(userId)?.balance ?? 0;
}

export function addBalance(userId: number, amount: number): boolean {
  const user = users.get(userId);
  if (!user) return false;
  user.balance += amount;
  return true;
}

export function activateUser(userId: number): void {
  const user = users.get(userId);
  if (user) {
    user.isActivated = true;
    user.activatedAt = new Date();
  }
}

export function createToken(adminId: number): string {
  let code = generateTokenCode();
  while (tokens.has(code)) {
    code = generateTokenCode();
  }
  tokens.set(code, {
    code,
    createdByAdminId: adminId,
    createdAt: new Date(),
    isUsed: false,
  });
  return code;
}

export function validateAndUseToken(
  code: string,
  userId: number
): { valid: boolean; reason?: string } {
  const normalizedCode = code.trim().toUpperCase();
  const token = tokens.get(normalizedCode);

  if (!token) return { valid: false, reason: "not_found" };
  if (token.isUsed) return { valid: false, reason: "already_used" };

  token.isUsed = true;
  token.usedByUserId = userId;
  token.usedAt = new Date();

  activateUser(userId);
  return { valid: true };
}

export function getTokenCount(): number {
  return tokens.size;
}

export function getUnusedTokenCount(): number {
  return Array.from(tokens.values()).filter((t) => !t.isUsed).length;
}

export function createDepositRequest(userId: number, amount: number): DepositRequest {
  const id = generateDepositId();
  const req: DepositRequest = {
    id,
    userId,
    amount,
    createdAt: new Date(),
    status: "awaiting_receipt",
  };
  depositRequests.set(id, req);
  return req;
}

export function getDepositRequest(id: string): DepositRequest | undefined {
  return depositRequests.get(id);
}

export function getDepositRequestByUser(userId: number): DepositRequest | undefined {
  return Array.from(depositRequests.values())
    .filter((r) => r.userId === userId && (r.status === "awaiting_receipt" || r.status === "pending_review"))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}

export function attachReceiptToDeposit(depositId: string, fileId: string): DepositRequest | undefined {
  const req = depositRequests.get(depositId);
  if (!req) return undefined;
  req.receiptFileId = fileId;
  req.status = "pending_review";
  return req;
}

export function setDepositAdminMessage(depositId: string, adminChatId: number, messageId: number): void {
  const req = depositRequests.get(depositId);
  if (req) {
    req.adminChatId = adminChatId;
    req.adminMessageId = messageId;
  }
}

export function approveDepositRequest(depositId: string): DepositRequest | undefined {
  const req = depositRequests.get(depositId);
  if (!req || req.status !== "pending_review") return undefined;
  req.status = "approved";
  addBalance(req.userId, req.amount);
  return req;
}

export function rejectDepositRequest(depositId: string): DepositRequest | undefined {
  const req = depositRequests.get(depositId);
  if (!req || req.status !== "pending_review") return undefined;
  req.status = "rejected";
  return req;
}

export function setPendingBroadcast(adminId: number): void {
  pendingBroadcast.add(adminId);
}

export function clearPendingBroadcast(adminId: number): void {
  pendingBroadcast.delete(adminId);
}

export function isPendingBroadcast(adminId: number): boolean {
  return pendingBroadcast.has(adminId);
}

export function setPendingTokenEntry(userId: number): void {
  pendingTokenEntry.add(userId);
}

export function clearPendingTokenEntry(userId: number): void {
  pendingTokenEntry.delete(userId);
}

export function isPendingTokenEntry(userId: number): boolean {
  return pendingTokenEntry.has(userId);
}

export function setPendingDepositAmount(userId: number): void {
  pendingDepositAmount.add(userId);
}

export function clearPendingDepositAmount(userId: number): void {
  pendingDepositAmount.delete(userId);
}

export function isPendingDepositAmount(userId: number): boolean {
  return pendingDepositAmount.has(userId);
}

export function setPendingDepositReceipt(userId: number, depositId: string): void {
  pendingDepositReceipt.set(userId, depositId);
}

export function clearPendingDepositReceipt(userId: number): void {
  pendingDepositReceipt.delete(userId);
}

export function getPendingDepositReceiptId(userId: number): string | undefined {
  return pendingDepositReceipt.get(userId);
}

export function setPendingAdminBalance(adminId: number): void {
  pendingAdminBalance.add(adminId);
}

export function clearPendingAdminBalance(adminId: number): void {
  pendingAdminBalance.delete(adminId);
}

export function isPendingAdminBalance(adminId: number): boolean {
  return pendingAdminBalance.has(adminId);
}

export function setPendingAdminBalanceUserId(adminId: number, userId: number): void {
  pendingAdminBalanceUserId.set(adminId, userId);
}

export function clearPendingAdminBalanceUserId(adminId: number): void {
  pendingAdminBalanceUserId.delete(adminId);
}

export function getPendingAdminBalanceUserId(adminId: number): number | undefined {
  return pendingAdminBalanceUserId.get(adminId);
}

export function setPendingAdminMessageTo(adminId: number, userId: number, depositId: string): void {
  pendingAdminMessageTo.set(adminId, { userId, depositId });
}

export function clearPendingAdminMessageTo(adminId: number): void {
  pendingAdminMessageTo.delete(adminId);
}

export function getPendingAdminMessageTo(adminId: number): { userId: number; depositId: string } | undefined {
  return pendingAdminMessageTo.get(adminId);
}
