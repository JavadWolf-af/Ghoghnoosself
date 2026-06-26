import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

// ── Bold Unicode time helpers ─────────────────────────────────────────────────
const BOLD_MAP: Record<string, string> = {
  "0": "\u{1D7CE}", "1": "\u{1D7CF}", "2": "\u{1D7D0}", "3": "\u{1D7D1}",
  "4": "\u{1D7D2}", "5": "\u{1D7D3}", "6": "\u{1D7D4}", "7": "\u{1D7D5}",
  "8": "\u{1D7D6}", "9": "\u{1D7D7}",
};

function toBold(str: string): string {
  return str.split("").map(c => BOLD_MAP[c] ?? c).join("");
}

export function getIranBoldTime(): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const hour   = parts.find(p => p.type === "hour")?.value   ?? "00";
  const minute = parts.find(p => p.type === "minute")?.value ?? "00";
  return `${toBold(hour)}:${toBold(minute)}`;
}

// ── In-memory: pending GramJS auth sessions ───────────────────────────────────
const pendingAuth = new Map<number, {
  client: TelegramClient;
  phoneCodeHash: string;
  phone: string;
  apiId: number;
  apiHash: string;
}>();

// ── In-memory: active clock jobs ──────────────────────────────────────────────
const clockJobs = new Map<number, ReturnType<typeof setInterval>>();

// ── Create a fresh GramJS client ──────────────────────────────────────────────
function makeClient(apiId: number, apiHash: string, session = ""): TelegramClient {
  return new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 3,
    deviceModel: "Desktop",
    appVersion: "1.0.0",
    useWSS: false,
  });
}

// ── Update Telegram last name (connect → update → disconnect) ─────────────────
async function updateTelegramLastName(
  apiId: number, apiHash: string, sessionStr: string, lastName: string,
): Promise<void> {
  const client = makeClient(apiId, apiHash, sessionStr);
  try {
    await client.connect();
    await client.invoke(new Api.account.UpdateProfile({ lastName }));
  } finally {
    await client.disconnect().catch(() => {});
  }
}

// ── Clock job management ──────────────────────────────────────────────────────
export function stopClockJob(userId: number): void {
  const job = clockJobs.get(userId);
  if (job) {
    clearInterval(job);
    clockJobs.delete(userId);
    logger.info({ userId }, "Clock job stopped");
  }
}

export function startClockJob(
  userId: number, apiId: number, apiHash: string, sessionStr: string,
): void {
  stopClockJob(userId);

  const tick = () => {
    updateTelegramLastName(apiId, apiHash, sessionStr, getIranBoldTime())
      .catch(err => logger.warn({ err, userId }, "Clock tick error"));
  };

  tick(); // immediate update
  const job = setInterval(tick, 60_000);
  clockJobs.set(userId, job);
  logger.info({ userId }, "Clock job started");
}

export function isClockJobActive(userId: number): boolean {
  return clockJobs.has(userId);
}

// ── Load all enabled clock jobs from DB on startup ────────────────────────────
export async function loadAllClockJobs(): Promise<void> {
  try {
    const rows = await db.select({
      id: users.id, tgApiId: users.tgApiId,
      tgApiHash: users.tgApiHash, tgSession: users.tgSession,
    }).from(users).where(eq(users.clockEnabled, true));

    for (const row of rows) {
      if (row.tgSession && row.tgApiId && row.tgApiHash) {
        startClockJob(row.id, row.tgApiId, row.tgApiHash, row.tgSession);
      }
    }
    logger.info({ count: rows.length }, "Clock jobs loaded");
  } catch (err) {
    logger.error({ err }, "loadAllClockJobs error");
  }
}

// ── Step 1: Send auth code via MTProto ────────────────────────────────────────
export async function initiateUserbotAuth(
  userId: number, apiId: number, apiHash: string, phone: string,
): Promise<"ok" | "error"> {
  cancelUserbotAuth(userId); // clean up any previous pending
  try {
    const client = makeClient(apiId, apiHash);
    await client.connect();
    const { phoneCodeHash } = await client.sendCode({ apiId, apiHash }, phone);
    pendingAuth.set(userId, { client, phoneCodeHash, phone, apiId, apiHash });
    return "ok";
  } catch (err) {
    logger.error({ err, userId }, "initiateUserbotAuth error");
    return "error";
  }
}

// ── Step 2: Confirm auth code → save session ──────────────────────────────────
export async function confirmUserbotAuth(
  userId: number, code: string,
): Promise<"ok" | "invalid_code" | "2fa_needed" | "error"> {
  const pending = pendingAuth.get(userId);
  if (!pending) return "error";
  const { client, phoneCodeHash, phone } = pending;
  try {
    await client.invoke(new Api.auth.SignIn({
      phoneNumber: phone,
      phoneCodeHash,
      phoneCode: code,
    }));
    const sessionStr = (client.session as StringSession).save();
    await db.update(users).set({ tgSession: sessionStr }).where(eq(users.id, userId));
    pendingAuth.delete(userId);
    await client.disconnect().catch(() => {});
    return "ok";
  } catch (err: unknown) {
    const msg = String((err as { message?: string })?.message ?? "");
    if (msg.includes("PHONE_CODE_INVALID") || msg.includes("PhoneCodeInvalid")) {
      return "invalid_code";
    }
    if (msg.includes("SESSION_PASSWORD_NEEDED") || msg.includes("SessionPasswordNeeded")) {
      cancelUserbotAuth(userId);
      return "2fa_needed";
    }
    logger.error({ err, userId }, "confirmUserbotAuth error");
    cancelUserbotAuth(userId);
    return "error";
  }
}

// ── Cancel pending auth (called on /start or nav:back) ────────────────────────
export function cancelUserbotAuth(userId: number): void {
  const pending = pendingAuth.get(userId);
  if (pending) {
    pending.client.disconnect().catch(() => {});
    pendingAuth.delete(userId);
  }
}
