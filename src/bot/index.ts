import TelegramBot from "node-telegram-bot-api";
import { logger } from "../lib/logger";
import {
  userMainKeyboard, walletKeyboard, referralKeyboard, profileKeyboard,
  backKeyboard, adminMainKeyboard, adminManageKeyboard,
  channelCheckKeyboard, blockedKeyboard, depositReviewKeyboard, unblockKeyboard,
  USER_BUTTONS, WALLET_BUTTONS, ADMIN_BUTTONS, MANAGE_BUTTONS, BACK_BUTTON,
} from "./keyboards";
import {
  WELCOME_MESSAGE, MAIN_MENU_MESSAGE, NOT_MEMBER_MESSAGE, MEMBERSHIP_CHECK_FAILED_MESSAGE,
  ADMIN_PANEL_MESSAGE, ADMIN_MANAGE_MESSAGE,
  SUPPORT_PROMPT, SUPPORT_SENT, ADMIN_SUPPORT_MESSAGE,
  BLOCKED_SUPPORT_PROMPT, BLOCKED_SUPPORT_SENT, BLOCKED_ONLY_SUPPORT,
  TOKEN_SECTION_MESSAGE, TOKEN_SUCCESS_MESSAGE, TOKEN_ALREADY_ACTIVATED_MESSAGE,
  TOKEN_INVALID_MESSAGE, TOKEN_ALREADY_USED_MESSAGE, TOKEN_CREATED_MESSAGE,
  WALLET_MESSAGE, ADD_BALANCE_AMOUNT_PROMPT, ADD_BALANCE_RECEIPT, BALANCE_REQUEST_SENT,
  BALANCE_APPROVED_USER, BALANCE_REJECTED_USER,
  BLOCKED_MESSAGE, UNBLOCKED_MESSAGE,
  TRANSFER_PROMPT, TRANSFER_SUCCESS, TRANSFER_FAILED,
  REFERRAL_MESSAGE, PROFILE_MESSAGE,
  STATS_MESSAGE, BROADCAST_PROMPT, BROADCAST_SENT,
  CARD_NUMBER_PROMPT, CARD_NUMBER_SET, BLOCKED_LIST_MESSAGE,
  ADMIN_DEPOSIT_REVIEW, ADMIN_SUPPORT_FROM_BLOCKED,
  ADMIN_ADD_BALANCE_PROMPT, ADMIN_ADD_BALANCE_AMOUNT_PROMPT,
  ADMIN_BALANCE_ADDED, ADMIN_USER_NOT_FOUND, ADMIN_INVALID_ID,
  ADMIN_MSG_PROMPT, ADMIN_MSG_SENT,
  ADMIN_DEPOSIT_APPROVED, ADMIN_DEPOSIT_REJECTED,
  ADMIN_USER_BLOCKED, ADMIN_USER_UNBLOCKED,
  ADMIN_TRANSFER_PROMPT, ADMIN_TRANSFER_SUCCESS,
} from "./messages";
import {
  addUser, getUser, getAllUsers, getBlockedUsers, getUserCount,
  isUserActivated, isUserBlocked, blockUser, unblockUser,
  createToken, validateAndUseToken, getTokenCount, getUnusedTokenCount,
  getUserBalance, addBalance, transferBalance,
  createBalanceRequest, getBalanceRequest, approveBalanceRequest, rejectBalanceRequest,
  setCardNumber, getCardNumber,
  setPending, clearAllPending, isPending, isPendingAdminManage, isPendingWallet,
  setAddBalanceData, getAddBalanceData,
  setAdminBalanceTarget, getAdminBalanceTarget,
  setAdminMessageTarget, getAdminMessageTarget,
} from "./store";

const BOT_TOKEN        = process.env["TELEGRAM_BOT_TOKEN"];
const CHANNEL_USERNAME = process.env["CHANNEL_USERNAME"] || "@Ghoghnoosself";
const CHANNEL_URL      = process.env["CHANNEL_URL"] || "https://t.me/Ghoghnoosself";
const ADMIN_IDS        = (process.env["ADMIN_IDS"] || "")
  .split(",").filter(Boolean).map((id) => parseInt(id.trim(), 10));

if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is required");

const bot = new TelegramBot(BOT_TOKEN, {
  polling: {
    interval: 300,
    autoStart: true,
    params: { timeout: 10, allowed_updates: ["message", "callback_query"] },
  },
});

// دستور /start همیشه در منوی دستورات ربات نمایش داده می‌شود
bot.setMyCommands([
  { command: "start", description: "🏠 شروع / بازگشت به منوی اصلی" },
]).catch((err) => logger.warn({ err }, "Failed to set bot commands"));

let BOT_USERNAME = "";
bot.getMe().then((me) => { BOT_USERNAME = me.username ?? ""; logger.info({ username: BOT_USERNAME }, "Bot started"); });

// ── ردیابی آخرین پیام پنل برای حذف پیش از نمایش پنل جدید ──────────────────
// کلید: chatId  —  مقدار: message_id آخرین پنل ارسال‌شده
const lastPanelMsg = new Map<number, number>();

async function deleteLastPanel(chatId: number): Promise<void> {
  const msgId = lastPanelMsg.get(chatId);
  if (msgId) {
    try { await bot.deleteMessage(chatId, msgId); } catch { /* ممکن است قبلاً حذف شده باشد */ }
    lastPanelMsg.delete(chatId);
  }
}

async function sendPanel(
  chatId: number,
  text: string,
  options: TelegramBot.SendMessageOptions
): Promise<void> {
  await deleteLastPanel(chatId);
  try {
    const msg = await bot.sendMessage(chatId, text, options);
    lastPanelMsg.set(chatId, msg.message_id);
  } catch (err: unknown) {
    const errMsg = (err as { message?: string })?.message ?? "";
    if (errMsg.includes("Too Many Requests")) {
      const wait = parseInt(errMsg.match(/retry after (\d+)/)?.[1] ?? "5") * 1000;
      await new Promise((r) => setTimeout(r, wait));
      try {
        const m = await bot.sendMessage(chatId, text, options);
        lastPanelMsg.set(chatId, m.message_id);
      } catch { /* ignore */ }
    } else if (!errMsg.includes("blocked") && !errMsg.includes("deactivated") && !errMsg.includes("chat not found")) {
      logger.error({ err, chatId }, "sendPanel error");
    }
  }
}

// ── safeSend برای پیام‌های غیرپنلی (اعلان‌ها، فوروارد، ...) ─────────────────
async function safeSend(fn: () => Promise<unknown>, ctx: string): Promise<boolean> {
  try { await fn(); return true; } catch (err: unknown) {
    const errMsg = (err as { message?: string })?.message ?? "";
    if (errMsg.includes("blocked") || errMsg.includes("deactivated") || errMsg.includes("chat not found")) return false;
    if (errMsg.includes("Too Many Requests")) {
      const wait = parseInt(errMsg.match(/retry after (\d+)/)?.[1] ?? "5") * 1000;
      await new Promise((r) => setTimeout(r, wait));
      try { await fn(); return true; } catch { return false; }
    }
    logger.error({ err, ctx }, "safeSend error");
    return false;
  }
}

function isAdmin(userId: number): boolean { return ADMIN_IDS.includes(userId); }

// باگ ۱ رفع شد: در صورت خطای API، false برمی‌گردانیم نه true
async function isMember(userId: number): Promise<{ member: boolean; failed: boolean }> {
  try {
    const m = await bot.getChatMember(CHANNEL_USERNAME, userId);
    const member = ["member", "administrator", "creator"].includes(m.status);
    return { member, failed: false };
  } catch {
    logger.warn({ userId, channel: CHANNEL_USERNAME }, "Membership check API failed");
    return { member: false, failed: true };
  }
}

async function delMsg(chatId: number, msgId: number) {
  try { await bot.deleteMessage(chatId, msgId); } catch { /* ignore */ }
}

// ── توابع ارسال پنل ──────────────────────────────────────────────────────────

async function sendMainMenu(chatId: number, firstName: string): Promise<void> {
  await sendPanel(chatId, MAIN_MENU_MESSAGE(firstName), { parse_mode: "Markdown", reply_markup: userMainKeyboard() });
}

async function sendWallet(chatId: number, userId: number): Promise<void> {
  await sendPanel(chatId, WALLET_MESSAGE(getUserBalance(userId)), { parse_mode: "Markdown", reply_markup: walletKeyboard() });
}

async function sendAdminPanel(chatId: number): Promise<void> {
  await sendPanel(chatId, ADMIN_PANEL_MESSAGE(), { parse_mode: "Markdown", reply_markup: adminMainKeyboard() });
}

async function sendAdminManage(chatId: number): Promise<void> {
  await sendPanel(chatId, ADMIN_MANAGE_MESSAGE(), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() });
}

async function notifyAdminsDeposit(
  requestId: string, amount: number, userId: number,
  firstName: string, username: string | undefined, receiptFileId: string
): Promise<void> {
  const caption = ADMIN_DEPOSIT_REVIEW(requestId, amount, userId, firstName, username);
  for (const adminId of ADMIN_IDS) {
    try {
      await bot.sendPhoto(adminId, receiptFileId, {
        caption, parse_mode: "Markdown",
        reply_markup: depositReviewKeyboard(requestId, userId),
      });
    } catch (err) { logger.warn({ adminId, err }, "Failed to notify admin of deposit"); }
  }
}

// ── /start ────────────────────────────────────────────────────────────────────
bot.onText(/\/start(.*)/, async (msg, match) => {
  try {
    const chatId    = msg.chat.id;
    const userId    = msg.from!.id;
    const firstName = msg.from!.first_name || "کاربر";
    const param     = (match?.[1] ?? "").trim();

    await delMsg(chatId, msg.message_id);
    clearAllPending(userId);

    let referredBy: number | undefined;
    if (param.startsWith("REF")) {
      const refId = parseInt(param.replace("REF", ""), 10);
      if (!isNaN(refId) && refId !== userId) referredBy = refId;
    }

    addUser({ id: userId, firstName, lastName: msg.from!.last_name, username: msg.from!.username, referredBy });

    if (isAdmin(userId)) { await sendAdminPanel(chatId); return; }

    if (param === "checked") {
      const { member, failed } = await isMember(userId);
      if (failed) {
        await sendPanel(chatId, MEMBERSHIP_CHECK_FAILED_MESSAGE(), { parse_mode: "Markdown", reply_markup: channelCheckKeyboard(CHANNEL_URL, BOT_USERNAME) });
      } else if (member) {
        await sendMainMenu(chatId, firstName);
      } else {
        await sendPanel(chatId, NOT_MEMBER_MESSAGE(), { parse_mode: "Markdown", reply_markup: channelCheckKeyboard(CHANNEL_URL, BOT_USERNAME) });
      }
      return;
    }

    const { member, failed } = await isMember(userId);
    if (failed) {
      await sendPanel(chatId, MEMBERSHIP_CHECK_FAILED_MESSAGE(), { parse_mode: "Markdown", reply_markup: channelCheckKeyboard(CHANNEL_URL, BOT_USERNAME) });
    } else if (member) {
      await sendMainMenu(chatId, firstName);
    } else {
      await sendPanel(chatId, WELCOME_MESSAGE(firstName), { parse_mode: "Markdown", reply_markup: channelCheckKeyboard(CHANNEL_URL, BOT_USERNAME) });
    }
  } catch (err) { logger.error({ err }, "/start error"); }
});

// ── Callback Queries ──────────────────────────────────────────────────────────
bot.on("callback_query", async (query) => {
  const adminId = query.from.id;
  const data    = query.data ?? "";
  const chatId  = query.message?.chat.id ?? adminId;
  const msgId   = query.message?.message_id;

  await bot.answerCallbackQuery(query.id).catch(() => {});
  if (!isAdmin(adminId)) return;

  if (data.startsWith("dep_approve:")) {
    const requestId = data.replace("dep_approve:", "");
    const result    = approveBalanceRequest(requestId);
    if (!result.ok) { await bot.sendMessage(chatId, "⚠️ این درخواست قبلاً پردازش شده است."); return; }
    const newBalance = getUserBalance(result.userId!);
    await safeSend(
      () => bot.sendMessage(result.userId!, BALANCE_APPROVED_USER(result.amount!, newBalance), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }),
      `notify:${result.userId}`
    );
    if (msgId) await bot.editMessageCaption(ADMIN_DEPOSIT_APPROVED(requestId), { chat_id: chatId, message_id: msgId, parse_mode: "Markdown" }).catch(() => {});
    return;
  }

  if (data.startsWith("dep_reject:")) {
    const requestId = data.replace("dep_reject:", "");
    const req = getBalanceRequest(requestId);
    const ok  = rejectBalanceRequest(requestId);
    if (!ok) { await bot.sendMessage(chatId, "⚠️ این درخواست قبلاً پردازش شده است."); return; }
    if (req) await safeSend(() => bot.sendMessage(req.userId, BALANCE_REJECTED_USER(), { parse_mode: "Markdown", reply_markup: walletKeyboard() }), `reject:${req.userId}`);
    if (msgId) await bot.editMessageCaption(ADMIN_DEPOSIT_REJECTED(requestId), { chat_id: chatId, message_id: msgId, parse_mode: "Markdown" }).catch(() => {});
    return;
  }

  if (data.startsWith("dep_msg:")) {
    const targetUserId = parseInt(data.replace("dep_msg:", ""), 10);
    setAdminMessageTarget(adminId, targetUserId);
    setPending(adminId, "adminMessageUser");
    await sendPanel(chatId, ADMIN_MSG_PROMPT(), { parse_mode: "Markdown", reply_markup: backKeyboard() });
    return;
  }

  if (data.startsWith("dep_block:")) {
    const targetUserId = parseInt(data.replace("dep_block:", ""), 10);
    blockUser(targetUserId);
    const targetUser = getUser(targetUserId);
    await safeSend(() => bot.sendMessage(targetUserId, BLOCKED_MESSAGE(), { parse_mode: "Markdown", reply_markup: blockedKeyboard() }), `block:${targetUserId}`);
    await bot.sendMessage(chatId, ADMIN_USER_BLOCKED(targetUser?.firstName ?? String(targetUserId), targetUserId), { parse_mode: "Markdown", reply_markup: unblockKeyboard(targetUserId) });
    return;
  }

  if (data.startsWith("unblock:")) {
    const targetUserId = parseInt(data.replace("unblock:", ""), 10);
    unblockUser(targetUserId);
    const targetUser = getUser(targetUserId);
    await safeSend(() => bot.sendMessage(targetUserId, UNBLOCKED_MESSAGE(), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }), `unblock:${targetUserId}`);
    if (msgId) await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: msgId }).catch(() => {});
    await bot.sendMessage(chatId, ADMIN_USER_UNBLOCKED(targetUser?.firstName ?? String(targetUserId), targetUserId), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() });
    return;
  }
});

// ── Photo (رسید واریز) ─────────────────────────────────────────────────────────
bot.on("photo", async (msg) => {
  try {
    const chatId    = msg.chat.id;
    const userId    = msg.from!.id;
    const firstName = msg.from!.first_name || "کاربر";

    if (isAdmin(userId)) return;
    if (!isPending(userId, "addBalance")) return;

    const balanceData = getAddBalanceData(userId);
    if (!balanceData) {
      await safeSend(
        () => bot.sendMessage(chatId, "⚠️ ابتدا مبلغ واریز را وارد کنید.", { parse_mode: "Markdown", reply_markup: backKeyboard() }),
        `noData:${chatId}`
      );
      return;
    }
    clearAllPending(userId);

    const fileId    = msg.photo![msg.photo!.length - 1]!.file_id;
    const requestId = createBalanceRequest(userId, balanceData.amount);
    const user      = getUser(userId);

    await notifyAdminsDeposit(requestId, balanceData.amount, userId, firstName, user?.username, fileId);
    await sendPanel(chatId, BALANCE_REQUEST_SENT(), { parse_mode: "Markdown", reply_markup: walletKeyboard() });
  } catch (err) { logger.error({ err }, "photo handler error"); }
});

// ── Messages ──────────────────────────────────────────────────────────────────
bot.on("message", async (msg) => {
  try {
    if (!msg.text) return;
    if (msg.text.startsWith("/")) return;

    const chatId    = msg.chat.id;
    const userId    = msg.from!.id;
    const firstName = msg.from!.first_name || "کاربر";
    const text      = msg.text;

    await delMsg(chatId, msg.message_id);

    // ── بازگشت ────────────────────────────────────────────────────────────────
    if (text === BACK_BUTTON) {
      if (isAdmin(userId)) {
        const fromManage = isPendingAdminManage(userId);
        clearAllPending(userId);
        if (fromManage) await sendAdminManage(chatId);
        else await sendAdminPanel(chatId);
      } else {
        const fromWallet = isPendingWallet(userId);
        clearAllPending(userId);
        if (fromWallet) await sendWallet(chatId, userId);
        else await sendMainMenu(chatId, firstName);
      }
      return;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ADMIN
    // ══════════════════════════════════════════════════════════════════════════
    if (isAdmin(userId)) {

      if (isPending(userId, "broadcast")) {
        clearAllPending(userId);
        const allUsers = getAllUsers();
        let sent = 0;
        for (const u of allUsers) {
          const ok = await safeSend(() => bot.sendMessage(u.id, `📢 *پیام از مدیریت:*\n\n${text}`, { parse_mode: "Markdown" }), `bc:${u.id}`);
          if (ok) sent++;
          await new Promise((r) => setTimeout(r, 50));
        }
        await sendAdminManage(chatId);
        await safeSend(() => bot.sendMessage(chatId, BROADCAST_SENT(sent), { parse_mode: "Markdown" }), `bcDone:${chatId}`);
        return;
      }

      if (isPending(userId, "cardNumberInput")) {
        clearAllPending(userId);
        setCardNumber(text.trim());
        await sendAdminManage(chatId);
        await safeSend(() => bot.sendMessage(chatId, CARD_NUMBER_SET(text.trim()), { parse_mode: "Markdown" }), `card:${chatId}`);
        return;
      }

      if (isPending(userId, "adminMessageUser")) {
        const targetUserId = getAdminMessageTarget(userId);
        clearAllPending(userId);
        if (targetUserId !== undefined)
          await safeSend(() => bot.sendMessage(targetUserId, `📨 *پیام از پشتیبانی:*\n\n${text}`, { parse_mode: "Markdown" }), `msgUser:${targetUserId}`);
        await sendAdminManage(chatId);
        await safeSend(() => bot.sendMessage(chatId, ADMIN_MSG_SENT(), { parse_mode: "Markdown" }), `msgDone:${chatId}`);
        return;
      }

      if (isPending(userId, "adminAddBalance")) {
        const targetId = parseInt(text.trim(), 10);
        if (isNaN(targetId)) {
          clearAllPending(userId);
          await sendAdminManage(chatId);
          await safeSend(() => bot.sendMessage(chatId, ADMIN_INVALID_ID(), { parse_mode: "Markdown" }), `invalidId:${chatId}`);
          return;
        }
        const targetUser = getUser(targetId);
        if (!targetUser) {
          clearAllPending(userId);
          await sendAdminManage(chatId);
          await safeSend(() => bot.sendMessage(chatId, ADMIN_USER_NOT_FOUND(), { parse_mode: "Markdown" }), `notFound:${chatId}`);
          return;
        }
        setAdminBalanceTarget(userId, targetId);
        setPending(userId, "adminAddBalanceAmount");
        await sendPanel(chatId, ADMIN_ADD_BALANCE_AMOUNT_PROMPT(targetUser.firstName), { parse_mode: "Markdown", reply_markup: backKeyboard() });
        return;
      }

      if (isPending(userId, "adminAddBalanceAmount")) {
        const targetId = getAdminBalanceTarget(userId);
        clearAllPending(userId);
        if (targetId === undefined) { await sendAdminManage(chatId); return; }
        const amount = parseInt(text.trim().replace(/\D/g, ""), 10);
        if (!amount || amount <= 0) {
          await sendAdminManage(chatId);
          await safeSend(() => bot.sendMessage(chatId, "❌ مبلغ نامعتبر است.", { parse_mode: "Markdown" }), `badAmount:${chatId}`);
          return;
        }
        addBalance(targetId, amount);
        const targetUser = getUser(targetId)!;
        const newBalance = getUserBalance(targetId);
        await safeSend(() => bot.sendMessage(targetId, BALANCE_APPROVED_USER(amount, newBalance), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }), `notify:${targetId}`);
        await sendAdminManage(chatId);
        await safeSend(() => bot.sendMessage(chatId, ADMIN_BALANCE_ADDED(targetUser.firstName, targetId, amount), { parse_mode: "Markdown" }), `added:${chatId}`);
        return;
      }

      if (isPending(userId, "adminTransfer")) {
        clearAllPending(userId);
        const parts = text.trim().split(/\s+/);
        if (parts.length !== 3) {
          await sendAdminManage(chatId);
          await safeSend(() => bot.sendMessage(chatId, TRANSFER_FAILED("invalid_format"), { parse_mode: "Markdown" }), `atr:${chatId}`);
          return;
        }
        const fromId = parseInt(parts[0]!, 10);
        const toId   = parseInt(parts[1]!, 10);
        const amount = parseInt(parts[2]!, 10);
        if (isNaN(fromId) || isNaN(toId) || isNaN(amount) || amount <= 0) {
          await sendAdminManage(chatId);
          await safeSend(() => bot.sendMessage(chatId, TRANSFER_FAILED("invalid_amount"), { parse_mode: "Markdown" }), `atr:${chatId}`);
          return;
        }
        const result = transferBalance(fromId, toId, amount);
        await sendAdminManage(chatId);
        await safeSend(
          () => bot.sendMessage(chatId, result.ok ? ADMIN_TRANSFER_SUCCESS(fromId, toId, amount) : TRANSFER_FAILED(result.reason ?? "unknown"), { parse_mode: "Markdown" }),
          `atr:${chatId}`
        );
        return;
      }

      if (text === ADMIN_BUTTONS.MENU_MANAGE) { await sendAdminManage(chatId); return; }
      if (text === ADMIN_BUTTONS.EXIT_ADMIN)  { await sendMainMenu(chatId, firstName); return; }

      if (text === MANAGE_BUTTONS.STATS) {
        await sendAdminManage(chatId);
        await safeSend(() => bot.sendMessage(chatId, STATS_MESSAGE(getUserCount(), getTokenCount(), getUnusedTokenCount()), { parse_mode: "Markdown" }), `stats:${chatId}`);
        return;
      }
      if (text === MANAGE_BUTTONS.BROADCAST) {
        setPending(userId, "broadcast");
        await sendPanel(chatId, BROADCAST_PROMPT(), { parse_mode: "Markdown", reply_markup: backKeyboard() });
        return;
      }
      if (text === MANAGE_BUTTONS.ADD_TOKEN) {
        const code = createToken(userId);
        await sendAdminManage(chatId);
        await safeSend(() => bot.sendMessage(chatId, TOKEN_CREATED_MESSAGE(code), { parse_mode: "Markdown" }), `addToken:${chatId}`);
        return;
      }
      if (text === MANAGE_BUTTONS.CARD_NUMBER) {
        setPending(userId, "cardNumberInput");
        await sendPanel(chatId, CARD_NUMBER_PROMPT(), { parse_mode: "Markdown", reply_markup: backKeyboard() });
        return;
      }
      if (text === MANAGE_BUTTONS.ADD_BALANCE) {
        setPending(userId, "adminAddBalance");
        await sendPanel(chatId, ADMIN_ADD_BALANCE_PROMPT(), { parse_mode: "Markdown", reply_markup: backKeyboard() });
        return;
      }
      if (text === MANAGE_BUTTONS.TRANSFER_USER) {
        setPending(userId, "adminTransfer");
        await sendPanel(chatId, ADMIN_TRANSFER_PROMPT(), { parse_mode: "Markdown", reply_markup: backKeyboard() });
        return;
      }
      if (text === MANAGE_BUTTONS.BLOCKED_LIST) {
        const blockedUsers = getBlockedUsers();
        await sendAdminManage(chatId);
        await safeSend(() => bot.sendMessage(chatId, BLOCKED_LIST_MESSAGE(blockedUsers), { parse_mode: "Markdown" }), `blockedList:${chatId}`);
        for (const u of blockedUsers) {
          await safeSend(
            () => bot.sendMessage(chatId, `👤 *${u.firstName}*${u.username ? ` (@${u.username})` : ""} — \`${u.id}\``, { parse_mode: "Markdown", reply_markup: unblockKeyboard(u.id) }),
            `unblockBtn:${u.id}`
          );
        }
        return;
      }
      return;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // کاربران مسدود
    // ══════════════════════════════════════════════════════════════════════════
    if (isUserBlocked(userId)) {
      // باگ ۳ رفع شد: پیام واقعی کاربر مسدود جمع‌آوری و فوروارد می‌شود
      if (isPending(userId, "blockedSupport")) {
        clearAllPending(userId);
        const user = getUser(userId);
        for (const adminId of ADMIN_IDS) {
          await safeSend(
            () => bot.sendMessage(adminId, ADMIN_SUPPORT_FROM_BLOCKED(userId, firstName, user?.username, text), { parse_mode: "Markdown", reply_markup: unblockKeyboard(userId) }),
            `blockedSupport:${adminId}`
          );
        }
        await safeSend(() => bot.sendMessage(chatId, BLOCKED_SUPPORT_SENT(), { parse_mode: "Markdown", reply_markup: blockedKeyboard() }), `blockedSent:${chatId}`);
        return;
      }
      if (text === USER_BUTTONS.SUPPORT) {
        setPending(userId, "blockedSupport");
        await safeSend(() => bot.sendMessage(chatId, BLOCKED_SUPPORT_PROMPT(), { parse_mode: "Markdown", reply_markup: blockedKeyboard() }), `blockedPrompt:${chatId}`);
      } else {
        await safeSend(() => bot.sendMessage(chatId, BLOCKED_ONLY_SUPPORT(), { parse_mode: "Markdown", reply_markup: blockedKeyboard() }), `blockedOnly:${chatId}`);
      }
      return;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // کاربران عادی — وضعیت‌های pending
    // ══════════════════════════════════════════════════════════════════════════

    if (isPending(userId, "tokenEntry")) {
      clearAllPending(userId);
      // باگ ۴ رفع شد: کاربر فعال‌شده نمی‌تواند توکن اضافه مصرف کند
      if (isUserActivated(userId)) {
        await sendPanel(chatId, TOKEN_ALREADY_ACTIVATED_MESSAGE(), { parse_mode: "Markdown", reply_markup: userMainKeyboard() });
        return;
      }
      const result = validateAndUseToken(text, userId);
      if (result.valid) {
        await sendPanel(chatId, TOKEN_SUCCESS_MESSAGE(firstName), { parse_mode: "Markdown", reply_markup: userMainKeyboard() });
      } else {
        const errMsg = result.reason === "already_used" ? TOKEN_ALREADY_USED_MESSAGE() : TOKEN_INVALID_MESSAGE();
        await sendPanel(chatId, errMsg, { parse_mode: "Markdown", reply_markup: userMainKeyboard() });
      }
      return;
    }

    // باگ ۲ رفع شد: پشتیبانی کاربر عادی — پیام واقعی دریافت و فوروارد می‌شود
    if (isPending(userId, "support")) {
      clearAllPending(userId);
      const user = getUser(userId);
      for (const adminId of ADMIN_IDS) {
        await safeSend(
          () => bot.sendMessage(adminId, ADMIN_SUPPORT_MESSAGE(userId, firstName, user?.username, text), { parse_mode: "Markdown" }),
          `support:${adminId}`
        );
      }
      await sendPanel(chatId, SUPPORT_SENT(), { parse_mode: "Markdown", reply_markup: userMainKeyboard() });
      return;
    }

    if (isPending(userId, "addBalance")) {
      // باگ ۶ رفع شد: اگر رسید قبلاً صادر شده، از تغییر مبلغ جلوگیری می‌شود
      if (getAddBalanceData(userId)) {
        await safeSend(
          () => bot.sendMessage(chatId, "📸 لطفاً تصویر رسید واریز را ارسال کنید.\nبرای لغو 🔙 را بزنید.", { parse_mode: "Markdown", reply_markup: backKeyboard() }),
          `waitPhoto:${chatId}`
        );
        return;
      }
      const amount = parseInt(text.replace(/\D/g, ""), 10);
      if (!amount || amount <= 0) {
        await safeSend(() => bot.sendMessage(chatId, "❌ مبلغ نامعتبر است. یک عدد صحیح وارد کنید.", { parse_mode: "Markdown", reply_markup: backKeyboard() }), `badAmount:${chatId}`);
        return;
      }
      const receiptId = Math.random().toString(36).slice(2, 10).toUpperCase();
      setAddBalanceData(userId, amount, receiptId);
      await sendPanel(chatId, ADD_BALANCE_RECEIPT(receiptId, amount, getCardNumber()), { parse_mode: "Markdown", reply_markup: backKeyboard() });
      return;
    }

    if (isPending(userId, "transferInput")) {
      clearAllPending(userId);
      const parts = text.trim().split(/\s+/);
      if (parts.length !== 2) {
        await sendPanel(chatId, TRANSFER_FAILED("invalid_format"), { parse_mode: "Markdown", reply_markup: walletKeyboard() });
        return;
      }
      const toId   = parseInt(parts[0]!, 10);
      const amount = parseInt(parts[1]!, 10);
      if (isNaN(toId) || isNaN(amount) || amount <= 0) {
        await sendPanel(chatId, TRANSFER_FAILED("invalid_amount"), { parse_mode: "Markdown", reply_markup: walletKeyboard() });
        return;
      }
      const result = transferBalance(userId, toId, amount);
      if (result.ok) {
        await sendPanel(chatId, TRANSFER_SUCCESS(toId, amount), { parse_mode: "Markdown", reply_markup: walletKeyboard() });
        await safeSend(
          () => bot.sendMessage(toId, `💸 *اعتبار دریافت شد*\n\n${amount.toLocaleString("fa-IR")} تومان از کاربر \`${userId}\` دریافت کردید.`, { parse_mode: "Markdown" }),
          `trNotify:${toId}`
        );
      } else {
        await sendPanel(chatId, TRANSFER_FAILED(result.reason ?? "unknown"), { parse_mode: "Markdown", reply_markup: walletKeyboard() });
      }
      return;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // کاربران عادی — دکمه‌های منو
    // ══════════════════════════════════════════════════════════════════════════

    if (text === USER_BUTTONS.WALLET) {
      await sendWallet(chatId, userId);
      return;
    }
    if (text === WALLET_BUTTONS.ADD_BALANCE) {
      setPending(userId, "addBalance");
      await sendPanel(chatId, ADD_BALANCE_AMOUNT_PROMPT(), { parse_mode: "Markdown", reply_markup: backKeyboard() });
      return;
    }
    if (text === WALLET_BUTTONS.TRANSFER) {
      if (getUserBalance(userId) <= 0) {
        await sendWallet(chatId, userId);
        await safeSend(() => bot.sendMessage(chatId, "❌ موجودی کافی ندارید.", { parse_mode: "Markdown" }), `noBalance:${chatId}`);
        return;
      }
      setPending(userId, "transferInput");
      await sendPanel(chatId, TRANSFER_PROMPT(), { parse_mode: "Markdown", reply_markup: backKeyboard() });
      return;
    }
    if (text === USER_BUTTONS.REFERRAL) {
      const user = getUser(userId);
      if (!user) { await sendMainMenu(chatId, firstName); return; }
      await sendPanel(chatId, REFERRAL_MESSAGE(user, BOT_USERNAME), { parse_mode: "Markdown", reply_markup: referralKeyboard() });
      return;
    }
    if (text === USER_BUTTONS.PROFILE) {
      const user = getUser(userId);
      if (!user) { await sendMainMenu(chatId, firstName); return; }
      await sendPanel(chatId, PROFILE_MESSAGE(user), { parse_mode: "Markdown", reply_markup: profileKeyboard() });
      return;
    }
    // باگ ۲ رفع شد: پشتیبانی اکنون پیام کاربر را جمع‌آوری می‌کند
    if (text === USER_BUTTONS.SUPPORT) {
      setPending(userId, "support");
      await sendPanel(chatId, SUPPORT_PROMPT(), { parse_mode: "Markdown", reply_markup: backKeyboard() });
      return;
    }
    if (text === USER_BUTTONS.TOKEN) {
      if (isUserActivated(userId)) {
        await sendPanel(chatId, TOKEN_ALREADY_ACTIVATED_MESSAGE(), { parse_mode: "Markdown", reply_markup: userMainKeyboard() });
        return;
      }
      setPending(userId, "tokenEntry");
      await sendPanel(chatId, TOKEN_SECTION_MESSAGE(), { parse_mode: "Markdown", reply_markup: backKeyboard() });
      return;
    }

    await sendMainMenu(chatId, firstName);
  } catch (err) { logger.error({ err }, "message handler error"); }
});

bot.on("polling_error", (err) => logger.error({ err }, "polling error"));
bot.on("error",         (err) => logger.error({ err }, "bot error"));

logger.info("Telegram bot initialized");
export default bot;
