import TelegramBot from "node-telegram-bot-api";
import { logger } from "../lib/logger";
import {
  userMainKeyboard, walletKeyboard, referralKeyboard, profileKeyboard,
  backKeyboard, adminBackKeyboard, adminMainKeyboard, adminManageKeyboard,
  channelCheckKeyboard, blockedKeyboard, depositReviewKeyboard, unblockKeyboard,
  USER_BUTTONS, WALLET_BUTTONS, ADMIN_BUTTONS, MANAGE_BUTTONS,
  BACK_BUTTON, MANAGE_BACK_BUTTON,
} from "./keyboards";
import {
  WELCOME_MESSAGE, MAIN_MENU_MESSAGE, NOT_MEMBER_MESSAGE,
  ADMIN_PANEL_MESSAGE, ADMIN_MANAGE_MESSAGE, SUPPORT_MESSAGE,
  BLOCKED_SUPPORT_SENT, BLOCKED_ONLY_SUPPORT,
  TOKEN_SECTION_MESSAGE, TOKEN_SUCCESS_MESSAGE,
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
  addUser, getUser, getAllUsers, getBlockedUsers, getUserCount, activateUser,
  isUserBlocked, blockUser, unblockUser,
  createToken, validateAndUseToken, getTokenCount, getUnusedTokenCount,
  getUserBalance, addBalance, transferBalance,
  createBalanceRequest, getBalanceRequest, approveBalanceRequest, rejectBalanceRequest,
  setCardNumber, getCardNumber,
  setPending, clearAllPending, isPending,
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

let BOT_USERNAME = "";
bot.getMe().then((me) => { BOT_USERNAME = me.username ?? ""; logger.info({ username: BOT_USERNAME }, "Bot started"); });

async function safeSend(fn: () => Promise<unknown>, ctx: string): Promise<boolean> {
  try { await fn(); return true; } catch (err: unknown) {
    const msg = (err as { message?: string })?.message ?? "";
    if (msg.includes("blocked") || msg.includes("deactivated") || msg.includes("chat not found")) return false;
    if (msg.includes("Too Many Requests")) {
      const wait = parseInt(msg.match(/retry after (\d+)/)?.[1] ?? "5") * 1000;
      await new Promise((r) => setTimeout(r, wait));
      try { await fn(); return true; } catch { return false; }
    }
    logger.error({ err, ctx }, "safeSend error");
    return false;
  }
}

function isAdmin(userId: number): boolean { return ADMIN_IDS.includes(userId); }

async function isMember(userId: number): Promise<boolean> {
  try {
    const m = await bot.getChatMember(CHANNEL_USERNAME, userId);
    return ["member", "administrator", "creator"].includes(m.status);
  } catch { return true; }
}

async function delMsg(chatId: number, msgId: number) {
  try { await bot.deleteMessage(chatId, msgId); } catch { /* ignore */ }
}

async function sendMainMenu(chatId: number, firstName: string) {
  await safeSend(
    () => bot.sendMessage(chatId, MAIN_MENU_MESSAGE(firstName), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }),
    `mainMenu:${chatId}`
  );
}

async function sendAdminPanel(chatId: number) {
  await safeSend(
    () => bot.sendMessage(chatId, ADMIN_PANEL_MESSAGE(), { parse_mode: "Markdown", reply_markup: adminMainKeyboard() }),
    `adminPanel:${chatId}`
  );
}

async function sendAdminManage(chatId: number) {
  await safeSend(
    () => bot.sendMessage(chatId, ADMIN_MANAGE_MESSAGE(), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }),
    `adminManage:${chatId}`
  );
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

// ── /start ────────────────────────────────────────────────────────
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

    if (isAdmin(userId)) {
      await sendAdminPanel(chatId);
      return;
    }

    if (param === "checked") {
      if (await isMember(userId)) await sendMainMenu(chatId, firstName);
      else await safeSend(() => bot.sendMessage(chatId, NOT_MEMBER_MESSAGE(), { parse_mode: "Markdown" }), `notMember:${chatId}`);
      return;
    }

    if (await isMember(userId)) await sendMainMenu(chatId, firstName);
    else await safeSend(
      () => bot.sendMessage(chatId, WELCOME_MESSAGE(firstName), { parse_mode: "Markdown", reply_markup: channelCheckKeyboard(CHANNEL_URL, BOT_USERNAME) }),
      `welcome:${chatId}`
    );
  } catch (err) { logger.error({ err }, "/start error"); }
});

// ── Callback Queries ──────────────────────────────────────────────
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
    if (!result.ok) { await bot.sendMessage(chatId, "⚠️ این درخواست قبلاً پردازش شده است.", { parse_mode: "Markdown" }); return; }
    const newBalance = getUserBalance(result.userId!);
    await safeSend(() => bot.sendMessage(result.userId!, BALANCE_APPROVED_USER(result.amount!, newBalance), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }), `notify:${result.userId}`);
    if (msgId) await bot.editMessageCaption(ADMIN_DEPOSIT_APPROVED(requestId), { chat_id: chatId, message_id: msgId, parse_mode: "Markdown" }).catch(() => {});
    return;
  }

  if (data.startsWith("dep_reject:")) {
    const requestId = data.replace("dep_reject:", "");
    const req = getBalanceRequest(requestId);
    const ok  = rejectBalanceRequest(requestId);
    if (!ok) { await bot.sendMessage(chatId, "⚠️ این درخواست قبلاً پردازش شده است.", { parse_mode: "Markdown" }); return; }
    if (req) await safeSend(() => bot.sendMessage(req.userId, BALANCE_REJECTED_USER(), { parse_mode: "Markdown", reply_markup: walletKeyboard() }), `reject:${req.userId}`);
    if (msgId) await bot.editMessageCaption(ADMIN_DEPOSIT_REJECTED(requestId), { chat_id: chatId, message_id: msgId, parse_mode: "Markdown" }).catch(() => {});
    return;
  }

  if (data.startsWith("dep_msg:")) {
    const targetUserId = parseInt(data.replace("dep_msg:", ""), 10);
    setAdminMessageTarget(adminId, targetUserId);
    setPending(adminId, "adminMessageUser");
    await safeSend(() => bot.sendMessage(chatId, ADMIN_MSG_PROMPT(), { parse_mode: "Markdown", reply_markup: adminBackKeyboard() }), `msgPrompt:${chatId}`);
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

// ── Photo (رسید واریز) ────────────────────────────────────────────
bot.on("photo", async (msg) => {
  try {
    const chatId    = msg.chat.id;
    const userId    = msg.from!.id;
    const firstName = msg.from!.first_name || "کاربر";

    if (isAdmin(userId)) return;
    if (!isPending(userId, "addBalance")) return;

    const balanceData = getAddBalanceData(userId);
    if (!balanceData) return;
    clearAllPending(userId);

    const fileId    = msg.photo![msg.photo!.length - 1]!.file_id;
    const requestId = createBalanceRequest(userId, balanceData.amount);
    const user      = getUser(userId);

    await notifyAdminsDeposit(requestId, balanceData.amount, userId, firstName, user?.username, fileId);
    await safeSend(() => bot.sendMessage(chatId, BALANCE_REQUEST_SENT(), { parse_mode: "Markdown", reply_markup: walletKeyboard() }), `balanceSent:${chatId}`);
  } catch (err) { logger.error({ err }, "photo handler error"); }
});

// ── Messages ──────────────────────────────────────────────────────
bot.on("message", async (msg) => {
  try {
    if (!msg.text && !msg.photo) return;
    if (msg.text?.startsWith("/")) return;

    const chatId    = msg.chat.id;
    const userId    = msg.from!.id;
    const firstName = msg.from!.first_name || "کاربر";
    const text      = msg.text ?? "";

    if (msg.text) await delMsg(chatId, msg.message_id);

    // ── بازگشت از منوی مدیریت → پنل ادمین ──
    if (text === MANAGE_BACK_BUTTON && isAdmin(userId)) {
      clearAllPending(userId);
      await sendAdminPanel(chatId);
      return;
    }

    // ── بازگشت عادی ──
    if (text === BACK_BUTTON) {
      clearAllPending(userId);
      if (isAdmin(userId)) {
        // از pending state ادمین → برگشت به منوی مدیریت (یک مرحله قبل)
        await sendAdminManage(chatId);
      } else {
        await sendMainMenu(chatId, firstName);
      }
      return;
    }

    // ══════════════════════════════════════════════════════════════════
    // ADMIN
    // ══════════════════════════════════════════════════════════════════
    if (isAdmin(userId)) {

      if (isPending(userId, "broadcast")) {
        if (!text) return;
        clearAllPending(userId);
        const allUsers = getAllUsers();
        let sent = 0;
        for (const u of allUsers) {
          const ok = await safeSend(() => bot.sendMessage(u.id, `📢 *پیام از مدیریت:*\n\n${text}`, { parse_mode: "Markdown" }), `bc:${u.id}`);
          if (ok) sent++;
          await new Promise((r) => setTimeout(r, 50));
        }
        await safeSend(() => bot.sendMessage(chatId, BROADCAST_SENT(sent), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }), `bcDone:${chatId}`);
        return;
      }

      if (isPending(userId, "cardNumberInput")) {
        if (!text) return;
        clearAllPending(userId);
        setCardNumber(text.trim());
        await safeSend(() => bot.sendMessage(chatId, CARD_NUMBER_SET(text.trim()), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }), `card:${chatId}`);
        return;
      }

      if (isPending(userId, "adminMessageUser")) {
        if (!text) return;
        const targetUserId = getAdminMessageTarget(userId);
        clearAllPending(userId);
        if (targetUserId !== undefined) {
          await safeSend(() => bot.sendMessage(targetUserId, `📨 *پیام از پشتیبانی:*\n\n${text}`, { parse_mode: "Markdown" }), `msgUser:${targetUserId}`);
        }
        await safeSend(() => bot.sendMessage(chatId, ADMIN_MSG_SENT(), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }), `msgDone:${chatId}`);
        return;
      }

      if (isPending(userId, "adminAddBalance")) {
        if (!text) return;
        const targetId = parseInt(text.trim(), 10);
        if (isNaN(targetId)) {
          clearAllPending(userId);
          await safeSend(() => bot.sendMessage(chatId, ADMIN_INVALID_ID(), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }), `invalidId:${chatId}`);
          return;
        }
        const targetUser = getUser(targetId);
        if (!targetUser) {
          clearAllPending(userId);
          await safeSend(() => bot.sendMessage(chatId, ADMIN_USER_NOT_FOUND(), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }), `notFound:${chatId}`);
          return;
        }
        setAdminBalanceTarget(userId, targetId);
        setPending(userId, "adminAddBalanceAmount");
        await safeSend(() => bot.sendMessage(chatId, ADMIN_ADD_BALANCE_AMOUNT_PROMPT(targetUser.firstName), { parse_mode: "Markdown", reply_markup: adminBackKeyboard() }), `addBalAmount:${chatId}`);
        return;
      }

      if (isPending(userId, "adminAddBalanceAmount")) {
        if (!text) return;
        const targetId = getAdminBalanceTarget(userId);
        clearAllPending(userId);
        if (targetId === undefined) { await sendAdminManage(chatId); return; }
        const amount = parseInt(text.trim().replace(/\D/g, ""), 10);
        if (!amount || amount <= 0) {
          await safeSend(() => bot.sendMessage(chatId, "❌ مبلغ نامعتبر است.", { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }), `badAmount:${chatId}`);
          return;
        }
        addBalance(targetId, amount);
        const targetUser = getUser(targetId)!;
        const newBalance = getUserBalance(targetId);
        await safeSend(() => bot.sendMessage(targetId, BALANCE_APPROVED_USER(amount, newBalance), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }), `notify:${targetId}`);
        await safeSend(() => bot.sendMessage(chatId, ADMIN_BALANCE_ADDED(targetUser.firstName, targetId, amount), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }), `added:${chatId}`);
        return;
      }

      if (isPending(userId, "adminTransfer")) {
        if (!text) return;
        clearAllPending(userId);
        const parts = text.trim().split(/\s+/);
        if (parts.length !== 3) {
          await safeSend(() => bot.sendMessage(chatId, TRANSFER_FAILED("invalid_format"), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }), `atr:${chatId}`);
          return;
        }
        const fromId = parseInt(parts[0]!, 10);
        const toId   = parseInt(parts[1]!, 10);
        const amount = parseInt(parts[2]!, 10);
        if (isNaN(fromId) || isNaN(toId) || isNaN(amount) || amount <= 0) {
          await safeSend(() => bot.sendMessage(chatId, TRANSFER_FAILED("invalid_amount"), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }), `atr:${chatId}`);
          return;
        }
        const result = transferBalance(fromId, toId, amount);
        await safeSend(() => bot.sendMessage(chatId, result.ok ? ADMIN_TRANSFER_SUCCESS(fromId, toId, amount) : TRANSFER_FAILED(result.reason ?? "unknown"), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }), `atr:${chatId}`);
        return;
      }

      if (text === ADMIN_BUTTONS.MENU_MANAGE) {
        await sendAdminManage(chatId);
        return;
      }
      if (text === ADMIN_BUTTONS.EXIT_ADMIN) {
        await sendMainMenu(chatId, firstName);
        return;
      }

      if (text === MANAGE_BUTTONS.STATS) {
        await safeSend(() => bot.sendMessage(chatId, STATS_MESSAGE(getUserCount(), getTokenCount(), getUnusedTokenCount()), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }), `stats:${chatId}`);
        return;
      }
      if (text === MANAGE_BUTTONS.BROADCAST) {
        setPending(userId, "broadcast");
        await safeSend(() => bot.sendMessage(chatId, BROADCAST_PROMPT(), { parse_mode: "Markdown", reply_markup: adminBackKeyboard() }), `bcPrompt:${chatId}`);
        return;
      }
      if (text === MANAGE_BUTTONS.ADD_TOKEN) {
        const code = createToken(userId);
        await safeSend(() => bot.sendMessage(chatId, TOKEN_CREATED_MESSAGE(code), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }), `addToken:${chatId}`);
        return;
      }
      if (text === MANAGE_BUTTONS.CARD_NUMBER) {
        setPending(userId, "cardNumberInput");
        await safeSend(() => bot.sendMessage(chatId, CARD_NUMBER_PROMPT(), { parse_mode: "Markdown", reply_markup: adminBackKeyboard() }), `cardPrompt:${chatId}`);
        return;
      }
      if (text === MANAGE_BUTTONS.ADD_BALANCE) {
        setPending(userId, "adminAddBalance");
        await safeSend(() => bot.sendMessage(chatId, ADMIN_ADD_BALANCE_PROMPT(), { parse_mode: "Markdown", reply_markup: adminBackKeyboard() }), `addBal:${chatId}`);
        return;
      }
      if (text === MANAGE_BUTTONS.TRANSFER_USER) {
        setPending(userId, "adminTransfer");
        await safeSend(() => bot.sendMessage(chatId, ADMIN_TRANSFER_PROMPT(), { parse_mode: "Markdown", reply_markup: adminBackKeyboard() }), `atrPrompt:${chatId}`);
        return;
      }
      if (text === MANAGE_BUTTONS.BLOCKED_LIST) {
        const blockedUsers = getBlockedUsers();
        await safeSend(
          () => bot.sendMessage(chatId, BLOCKED_LIST_MESSAGE(blockedUsers), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }),
          `blockedList:${chatId}`
        );
        for (const u of blockedUsers) {
          await safeSend(
            () => bot.sendMessage(chatId,
              `👤 *${u.firstName}*${u.username ? ` (@${u.username})` : ""} — \`${u.id}\``,
              { parse_mode: "Markdown", reply_markup: unblockKeyboard(u.id) }
            ),
            `unblockBtn:${u.id}`
          );
        }
        return;
      }
      return;
    }

    // ══════════════════════════════════════════════════════════════════
    // BLOCKED USERS
    // ══════════════════════════════════════════════════════════════════
    if (isUserBlocked(userId)) {
      if (text === USER_BUTTONS.SUPPORT) {
        const user = getUser(userId);
        for (const adminId of ADMIN_IDS) {
          await safeSend(
            () => bot.sendMessage(adminId,
              ADMIN_SUPPORT_FROM_BLOCKED(userId, firstName, user?.username, "کاربر درخواست پشتیبانی دارد."),
              { parse_mode: "Markdown", reply_markup: unblockKeyboard(userId) }
            ),
            `blockedSupport:${adminId}`
          );
        }
        await safeSend(() => bot.sendMessage(chatId, BLOCKED_SUPPORT_SENT(), { parse_mode: "Markdown", reply_markup: blockedKeyboard() }), `blockedSent:${chatId}`);
      } else {
        await safeSend(() => bot.sendMessage(chatId, BLOCKED_ONLY_SUPPORT(), { parse_mode: "Markdown", reply_markup: blockedKeyboard() }), `blockedOnly:${chatId}`);
      }
      return;
    }

    // ══════════════════════════════════════════════════════════════════
    // USER
    // ══════════════════════════════════════════════════════════════════

    if (isPending(userId, "tokenEntry")) {
      if (!text) return;
      clearAllPending(userId);
      const result = validateAndUseToken(text, userId);
      if (result.valid) {
        await safeSend(() => bot.sendMessage(chatId, TOKEN_SUCCESS_MESSAGE(firstName), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }), `tokenOk:${chatId}`);
      } else {
        const errMsg = result.reason === "already_used" ? TOKEN_ALREADY_USED_MESSAGE() : TOKEN_INVALID_MESSAGE();
        await safeSend(() => bot.sendMessage(chatId, errMsg, { parse_mode: "Markdown", reply_markup: userMainKeyboard() }), `tokenFail:${chatId}`);
      }
      return;
    }

    if (isPending(userId, "addBalance")) {
      if (!text) return;
      const amount = parseInt(text.replace(/\D/g, ""), 10);
      if (!amount || amount <= 0) {
        await safeSend(() => bot.sendMessage(chatId, "❌ مبلغ نامعتبر است. یک عدد صحیح وارد کنید.", { parse_mode: "Markdown" }), `badAmount:${chatId}`);
        return;
      }
      const receiptId = Math.random().toString(36).slice(2, 10).toUpperCase();
      setAddBalanceData(userId, amount, receiptId);
      await safeSend(() => bot.sendMessage(chatId, ADD_BALANCE_RECEIPT(receiptId, amount, getCardNumber()), { parse_mode: "Markdown", reply_markup: backKeyboard() }), `receipt:${chatId}`);
      return;
    }

    if (isPending(userId, "transferInput")) {
      if (!text) return;
      clearAllPending(userId);
      const parts = text.trim().split(/\s+/);
      if (parts.length !== 2) { await safeSend(() => bot.sendMessage(chatId, TRANSFER_FAILED("invalid_format"), { parse_mode: "Markdown", reply_markup: walletKeyboard() }), `tr:${chatId}`); return; }
      const toId   = parseInt(parts[0]!, 10);
      const amount = parseInt(parts[1]!, 10);
      if (isNaN(toId) || isNaN(amount) || amount <= 0) { await safeSend(() => bot.sendMessage(chatId, TRANSFER_FAILED("invalid_amount"), { parse_mode: "Markdown", reply_markup: walletKeyboard() }), `tr:${chatId}`); return; }
      const result = transferBalance(userId, toId, amount);
      if (result.ok) {
        await safeSend(() => bot.sendMessage(chatId, TRANSFER_SUCCESS(toId, amount), { parse_mode: "Markdown", reply_markup: walletKeyboard() }), `trOk:${chatId}`);
        await safeSend(() => bot.sendMessage(toId, `💸 *اعتبار دریافت شد*\n\n${amount.toLocaleString("fa-IR")} تومان از کاربر \`${userId}\` دریافت کردید.`, { parse_mode: "Markdown" }), `trNotify:${toId}`);
      } else {
        await safeSend(() => bot.sendMessage(chatId, TRANSFER_FAILED(result.reason ?? "unknown"), { parse_mode: "Markdown", reply_markup: walletKeyboard() }), `trFail:${chatId}`);
      }
      return;
    }

    if (text === USER_BUTTONS.WALLET) {
      await safeSend(() => bot.sendMessage(chatId, WALLET_MESSAGE(getUserBalance(userId)), { parse_mode: "Markdown", reply_markup: walletKeyboard() }), `wallet:${chatId}`);
      return;
    }
    if (text === WALLET_BUTTONS.ADD_BALANCE) {
      setPending(userId, "addBalance");
      await safeSend(() => bot.sendMessage(chatId, ADD_BALANCE_AMOUNT_PROMPT(), { parse_mode: "Markdown", reply_markup: backKeyboard() }), `addBalance:${chatId}`);
      return;
    }
    if (text === WALLET_BUTTONS.TRANSFER) {
      if (getUserBalance(userId) <= 0) {
        await safeSend(() => bot.sendMessage(chatId, `❌ موجودی کافی ندارید.`, { parse_mode: "Markdown", reply_markup: walletKeyboard() }), `noBalance:${chatId}`);
        return;
      }
      setPending(userId, "transferInput");
      await safeSend(() => bot.sendMessage(chatId, TRANSFER_PROMPT(), { parse_mode: "Markdown", reply_markup: backKeyboard() }), `trPrompt:${chatId}`);
      return;
    }
    if (text === USER_BUTTONS.REFERRAL) {
      const user = getUser(userId);
      if (!user) { await sendMainMenu(chatId, firstName); return; }
      await safeSend(() => bot.sendMessage(chatId, REFERRAL_MESSAGE(user, BOT_USERNAME), { parse_mode: "Markdown", reply_markup: referralKeyboard() }), `referral:${chatId}`);
      return;
    }
    if (text === USER_BUTTONS.PROFILE) {
      const user = getUser(userId);
      if (!user) { await sendMainMenu(chatId, firstName); return; }
      await safeSend(() => bot.sendMessage(chatId, PROFILE_MESSAGE(user), { parse_mode: "Markdown", reply_markup: profileKeyboard() }), `profile:${chatId}`);
      return;
    }
    if (text === USER_BUTTONS.SUPPORT) {
      await safeSend(() => bot.sendMessage(chatId, SUPPORT_MESSAGE(), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }), `support:${chatId}`);
      return;
    }
    if (text === USER_BUTTONS.TOKEN) {
      await safeSend(() => bot.sendMessage(chatId, TOKEN_SECTION_MESSAGE(), { parse_mode: "Markdown", reply_markup: backKeyboard() }), `tokenSection:${chatId}`);
      setPending(userId, "tokenEntry");
      return;
    }

    await sendMainMenu(chatId, firstName);
  } catch (err) { logger.error({ err }, "message handler error"); }
});

bot.on("polling_error", (err) => logger.error({ err }, "polling error"));
bot.on("error",         (err) => logger.error({ err }, "bot error"));

logger.info("Telegram bot initialized");
export default bot;
