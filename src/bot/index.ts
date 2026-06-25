import TelegramBot from "node-telegram-bot-api";
import { logger } from "../lib/logger";
import {
  userMenuKeyboard,
  activatedUserKeyboard,
  blockedUserKeyboard,
  adminMenuKeyboard,
  menuManageKeyboard,
  removeKeyboard,
  channelCheckKeyboard,
  depositReviewKeyboard,
  unblockKeyboard,
  USER_BUTTONS,
  ACTIVATED_USER_BUTTONS,
  ADMIN_BUTTONS,
  MENU_MANAGE_BUTTONS,
} from "./keyboards";
import {
  WELCOME_MESSAGE,
  ALREADY_MEMBER_MESSAGE,
  NOT_MEMBER_MESSAGE,
  ADMIN_PANEL_MESSAGE,
  SUPPORT_MESSAGE,
  BLOCKED_SUPPORT_MESSAGE,
  STATS_MESSAGE,
  BROADCAST_PROMPT,
  BROADCAST_SENT,
  TOKEN_CREATED_MESSAGE,
  TOKEN_ENTER_PROMPT,
  TOKEN_SUCCESS_MESSAGE,
  TOKEN_INVALID_MESSAGE,
  TOKEN_ALREADY_USED_MESSAGE,
  ALREADY_ACTIVATED_MESSAGE,
  BALANCE_ENTER_AMOUNT,
  BALANCE_RECEIPT,
  BALANCE_RECEIPT_RECEIVED,
  BALANCE_INVALID_AMOUNT,
  BALANCE_APPROVED_MESSAGE,
  BALANCE_REJECTED_MESSAGE,
  BLOCKED_MESSAGE,
  BLOCKED_ONLY_SUPPORT,
  UNBLOCKED_MESSAGE,
  ADMIN_DEPOSIT_REVIEW,
  ADMIN_ADD_BALANCE_PROMPT,
  ADMIN_ADD_BALANCE_AMOUNT_PROMPT,
  ADMIN_BALANCE_ADDED,
  ADMIN_USER_NOT_FOUND,
  ADMIN_INVALID_ID,
  ADMIN_MSG_TO_USER_PROMPT,
  ADMIN_MSG_SENT,
  ADMIN_DEPOSIT_APPROVED,
  ADMIN_DEPOSIT_REJECTED,
  ADMIN_USER_BLOCKED,
  ADMIN_USER_UNBLOCKED,
  DEPOSIT_NO_PENDING,
} from "./messages";
import {
  addUser,
  getUser,
  getAllUsers,
  getUserCount,
  isUserActivated,
  isUserBlocked,
  blockUser,
  unblockUser,
  getUserBalance,
  addBalance,
  createToken,
  validateAndUseToken,
  getTokenCount,
  getUnusedTokenCount,
  createDepositRequest,
  getDepositRequest,
  getDepositRequestByUser,
  attachReceiptToDeposit,
  setDepositAdminMessage,
  approveDepositRequest,
  rejectDepositRequest,
  setPendingBroadcast,
  clearPendingBroadcast,
  isPendingBroadcast,
  setPendingTokenEntry,
  clearPendingTokenEntry,
  isPendingTokenEntry,
  setPendingDepositAmount,
  clearPendingDepositAmount,
  isPendingDepositAmount,
  setPendingDepositReceipt,
  clearPendingDepositReceipt,
  getPendingDepositReceiptId,
  setPendingAdminBalance,
  clearPendingAdminBalance,
  isPendingAdminBalance,
  setPendingAdminBalanceUserId,
  clearPendingAdminBalanceUserId,
  getPendingAdminBalanceUserId,
  setPendingAdminMessageTo,
  clearPendingAdminMessageTo,
  getPendingAdminMessageTo,
} from "./store";

const BOT_TOKEN = process.env["TELEGRAM_BOT_TOKEN"];
const CHANNEL_USERNAME = process.env["CHANNEL_USERNAME"] || "@Ghoghnoosself";
const CHANNEL_URL = process.env["CHANNEL_URL"] || "https://t.me/Ghoghnoosself";
const ADMIN_IDS = (process.env["ADMIN_IDS"] || "8191950992,8332628191")
  .split(",")
  .map((id) => parseInt(id.trim(), 10));
const CARD_NUMBER = process.env["CARD_NUMBER"] || "6037-XXXX-XXXX-XXXX";

if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is required");

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

let BOT_USERNAME = "";
bot.getMe().then((me) => {
  BOT_USERNAME = me.username ?? "";
  logger.info({ username: BOT_USERNAME }, "Bot username fetched");
});

function isAdmin(userId: number): boolean {
  return ADMIN_IDS.includes(userId);
}

async function isMemberOfChannel(
  userId: number
): Promise<{ isMember: boolean; checkFailed: boolean }> {
  try {
    const member = await bot.getChatMember(CHANNEL_USERNAME, userId);
    const isMember = ["member", "administrator", "creator"].includes(
      member.status
    );
    logger.info({ userId, status: member.status, isMember }, "Membership check");
    return { isMember, checkFailed: false };
  } catch (err) {
    logger.warn({ userId, channel: CHANNEL_USERNAME, err }, "Membership check failed");
    return { isMember: false, checkFailed: true };
  }
}

async function deleteMsg(chatId: number, messageId: number): Promise<void> {
  try {
    await bot.deleteMessage(chatId, messageId);
  } catch {
    // ignore
  }
}

function getUserKeyboard(userId: number) {
  if (isUserBlocked(userId)) return blockedUserKeyboard();
  return isUserActivated(userId) ? activatedUserKeyboard() : userMenuKeyboard();
}

async function sendUserMenu(chatId: number, userId: number, firstName: string): Promise<void> {
  await bot.sendMessage(chatId, ALREADY_MEMBER_MESSAGE(firstName), {
    parse_mode: "Markdown",
    reply_markup: getUserKeyboard(userId),
  });
}

async function sendAdminPanel(chatId: number): Promise<void> {
  await bot.sendMessage(chatId, ADMIN_PANEL_MESSAGE(), {
    parse_mode: "Markdown",
    reply_markup: adminMenuKeyboard(),
  });
}

async function handleMembershipCheck(
  chatId: number,
  userId: number,
  firstName: string,
  lastName: string | undefined,
  username: string | undefined
): Promise<void> {
  const { isMember, checkFailed } = await isMemberOfChannel(userId);
  if (isMember || checkFailed) {
    addUser({ id: userId, firstName, lastName, username });
    await sendUserMenu(chatId, userId, firstName);
  } else {
    await bot.sendMessage(chatId, NOT_MEMBER_MESSAGE(), {
      parse_mode: "Markdown",
      reply_markup: channelCheckKeyboard(CHANNEL_URL, BOT_USERNAME),
    });
  }
}

async function notifyAdminsOfDeposit(depositId: string): Promise<void> {
  const req = getDepositRequest(depositId);
  if (!req) return;

  const user = getUser(req.userId);
  const firstName = user?.firstName ?? "ناشناس";
  const username = user?.username;
  const caption = ADMIN_DEPOSIT_REVIEW(depositId, req.amount, req.userId, firstName, username);

  for (const adminId of ADMIN_IDS) {
    try {
      let sentMsg: Awaited<ReturnType<typeof bot.sendMessage>>;
      if (req.receiptFileId) {
        sentMsg = await bot.sendPhoto(adminId, req.receiptFileId, {
          caption,
          parse_mode: "Markdown",
          reply_markup: depositReviewKeyboard(depositId),
        });
      } else {
        sentMsg = await bot.sendMessage(adminId, caption, {
          parse_mode: "Markdown",
          reply_markup: depositReviewKeyboard(depositId),
        });
      }
      setDepositAdminMessage(depositId, adminId, sentMsg.message_id);
    } catch (err) {
      logger.warn({ adminId, err }, "Failed to notify admin of deposit");
    }
  }
}

bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from!.id;
  const firstName = msg.from!.first_name || "کاربر";
  const lastName = msg.from!.last_name;
  const username = msg.from!.username;
  const param = (match?.[1] ?? "").trim();

  await deleteMsg(chatId, msg.message_id);
  addUser({ id: userId, firstName, lastName, username });

  if (isAdmin(userId)) {
    await sendAdminPanel(chatId);
    return;
  }

  if (param === "checked") {
    await handleMembershipCheck(chatId, userId, firstName, lastName, username);
    return;
  }

  const { isMember, checkFailed } = await isMemberOfChannel(userId);
  if (isMember || checkFailed) {
    await sendUserMenu(chatId, userId, firstName);
  } else {
    await bot.sendMessage(chatId, WELCOME_MESSAGE(firstName), {
      parse_mode: "Markdown",
      reply_markup: channelCheckKeyboard(CHANNEL_URL, BOT_USERNAME),
    });
  }
});

// ─── CALLBACK QUERIES (inline keyboard buttons) ───────────────────────────────
bot.on("callback_query", async (query) => {
  const adminId = query.from.id;
  const data = query.data ?? "";
  const msgId = query.message?.message_id;
  const chatId = query.message?.chat.id ?? adminId;

  await bot.answerCallbackQuery(query.id);

  if (!isAdmin(adminId)) return;

  // ─── Approve deposit ───
  if (data.startsWith("dep_approve:")) {
    const depositId = data.replace("dep_approve:", "");
    const req = approveDepositRequest(depositId);
    if (!req) {
      await bot.sendMessage(chatId, "⚠️ این درخواست قبلاً پردازش شده است.", { parse_mode: "Markdown" });
      return;
    }
    const user = getUser(req.userId);
    const newBalance = getUserBalance(req.userId);
    try {
      await bot.sendMessage(req.userId, BALANCE_APPROVED_MESSAGE(req.amount, newBalance), {
        parse_mode: "Markdown",
        reply_markup: getUserKeyboard(req.userId),
      });
    } catch { /* user blocked bot */ }
    if (msgId) {
      await bot.editMessageCaption?.(ADMIN_DEPOSIT_APPROVED(depositId), { chat_id: chatId, message_id: msgId, parse_mode: "Markdown" }).catch(() =>
        bot.editMessageText(ADMIN_DEPOSIT_APPROVED(depositId), { chat_id: chatId, message_id: msgId, parse_mode: "Markdown" }).catch(() => {})
      );
    }
    await bot.sendMessage(chatId, ADMIN_DEPOSIT_APPROVED(depositId), {
      parse_mode: "Markdown",
      reply_markup: adminMenuKeyboard(),
    });
    logger.info({ depositId, userId: req.userId, amount: req.amount }, "Deposit approved");
    return;
  }

  // ─── Reject deposit ───
  if (data.startsWith("dep_reject:")) {
    const depositId = data.replace("dep_reject:", "");
    const req = rejectDepositRequest(depositId);
    if (!req) {
      await bot.sendMessage(chatId, "⚠️ این درخواست قبلاً پردازش شده است.", { parse_mode: "Markdown" });
      return;
    }
    const user = getUser(req.userId);
    try {
      await bot.sendMessage(req.userId, BALANCE_REJECTED_MESSAGE(), {
        parse_mode: "Markdown",
        reply_markup: getUserKeyboard(req.userId),
      });
    } catch { /* user blocked bot */ }
    await bot.sendMessage(chatId, ADMIN_DEPOSIT_REJECTED(depositId), {
      parse_mode: "Markdown",
      reply_markup: adminMenuKeyboard(),
    });
    return;
  }

  // ─── Message to user ───
  if (data.startsWith("dep_msg:")) {
    const depositId = data.replace("dep_msg:", "");
    const req = getDepositRequest(depositId);
    if (!req) return;
    setPendingAdminMessageTo(adminId, req.userId, depositId);
    await bot.sendMessage(chatId, ADMIN_MSG_TO_USER_PROMPT(), {
      parse_mode: "Markdown",
      reply_markup: removeKeyboard(),
    });
    return;
  }

  // ─── Block user ───
  if (data.startsWith("dep_block:")) {
    const depositId = data.replace("dep_block:", "");
    const req = getDepositRequest(depositId);
    if (!req) return;
    blockUser(req.userId);
    const user = getUser(req.userId);
    try {
      await bot.sendMessage(req.userId, BLOCKED_MESSAGE(), {
        parse_mode: "Markdown",
        reply_markup: blockedUserKeyboard(),
      });
    } catch { /* user blocked bot */ }
    await bot.sendMessage(chatId, ADMIN_USER_BLOCKED(user?.firstName ?? String(req.userId)), {
      parse_mode: "Markdown",
      reply_markup: {
        ...adminMenuKeyboard(),
        inline_keyboard: undefined,
      },
    });
    // also show unblock button
    await bot.sendMessage(chatId, `برای آزاد کردن کاربر:`, {
      reply_markup: unblockKeyboard(req.userId),
    });
    return;
  }

  // ─── Unblock user ───
  if (data.startsWith("unblock:")) {
    const targetUserId = parseInt(data.replace("unblock:", ""), 10);
    unblockUser(targetUserId);
    const user = getUser(targetUserId);
    try {
      await bot.sendMessage(targetUserId, UNBLOCKED_MESSAGE(), {
        parse_mode: "Markdown",
        reply_markup: getUserKeyboard(targetUserId),
      });
    } catch { /* user blocked bot */ }
    if (msgId) {
      await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: msgId }).catch(() => {});
    }
    await bot.sendMessage(chatId, ADMIN_USER_UNBLOCKED(user?.firstName ?? String(targetUserId)), {
      parse_mode: "Markdown",
      reply_markup: adminMenuKeyboard(),
    });
    return;
  }
});

// ─── PHOTO MESSAGES (user sending receipt) ───────────────────────────────────
bot.on("photo", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from!.id;

  await deleteMsg(chatId, msg.message_id);

  if (isAdmin(userId)) return;

  const depositId = getPendingDepositReceiptId(userId);
  if (!depositId) {
    await bot.sendMessage(chatId, DEPOSIT_NO_PENDING(), {
      parse_mode: "Markdown",
      reply_markup: getUserKeyboard(userId),
    });
    return;
  }

  const photos = msg.photo!;
  const fileId = photos[photos.length - 1]!.file_id;

  attachReceiptToDeposit(depositId, fileId);
  clearPendingDepositReceipt(userId);

  await bot.sendMessage(chatId, BALANCE_RECEIPT_RECEIVED(), {
    parse_mode: "Markdown",
    reply_markup: getUserKeyboard(userId),
  });

  await notifyAdminsOfDeposit(depositId);
});

bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;

  const chatId = msg.chat.id;
  const userId = msg.from!.id;
  const firstName = msg.from!.first_name || "کاربر";
  const text = msg.text;

  await deleteMsg(chatId, msg.message_id);

  // ─── ADMIN SECTION ───────────────────────────────────────────
  if (isAdmin(userId)) {
    // Pending: broadcast message
    if (isPendingBroadcast(userId)) {
      clearPendingBroadcast(userId);
      const users = getAllUsers();
      let sent = 0;
      for (const user of users) {
        try {
          await bot.sendMessage(user.id, `📢 *پیام از مدیریت:*\n\n${text}`, {
            parse_mode: "Markdown",
          });
          sent++;
        } catch { /* user blocked bot */ }
      }
      await bot.sendMessage(chatId, BROADCAST_SENT(sent), {
        parse_mode: "Markdown",
        reply_markup: adminMenuKeyboard(),
      });
      return;
    }

    // Pending: admin wants to send message to user
    const pendingMsg = getPendingAdminMessageTo(userId);
    if (pendingMsg) {
      clearPendingAdminMessageTo(userId);
      try {
        await bot.sendMessage(
          pendingMsg.userId,
          `📨 *پیام از پشتیبانی:*\n\n${text}`,
          { parse_mode: "Markdown" }
        );
      } catch { /* user blocked bot */ }
      await bot.sendMessage(chatId, ADMIN_MSG_SENT(), {
        parse_mode: "Markdown",
        reply_markup: adminMenuKeyboard(),
      });
      return;
    }

    // Pending: admin add balance - waiting for user ID
    if (isPendingAdminBalance(userId)) {
      clearPendingAdminBalance(userId);
      const targetId = parseInt(text.trim(), 10);
      if (isNaN(targetId)) {
        await bot.sendMessage(chatId, ADMIN_INVALID_ID(), {
          parse_mode: "Markdown",
          reply_markup: adminMenuKeyboard(),
        });
        return;
      }
      const targetUser = getUser(targetId);
      if (!targetUser) {
        await bot.sendMessage(chatId, ADMIN_USER_NOT_FOUND(), {
          parse_mode: "Markdown",
          reply_markup: adminMenuKeyboard(),
        });
        return;
      }
      setPendingAdminBalanceUserId(userId, targetId);
      await bot.sendMessage(chatId, ADMIN_ADD_BALANCE_AMOUNT_PROMPT(targetUser.firstName), {
        parse_mode: "Markdown",
        reply_markup: removeKeyboard(),
      });
      return;
    }

    // Pending: admin add balance - waiting for amount
    const pendingTargetId = getPendingAdminBalanceUserId(userId);
    if (pendingTargetId !== undefined) {
      clearPendingAdminBalanceUserId(userId);
      const amount = parseInt(text.trim(), 10);
      if (isNaN(amount) || amount <= 0) {
        await bot.sendMessage(chatId, BALANCE_INVALID_AMOUNT(), {
          parse_mode: "Markdown",
          reply_markup: adminMenuKeyboard(),
        });
        return;
      }
      addBalance(pendingTargetId, amount);
      const targetUser = getUser(pendingTargetId)!;
      const newBalance = getUserBalance(pendingTargetId);
      try {
        await bot.sendMessage(pendingTargetId, BALANCE_APPROVED_MESSAGE(amount, newBalance), {
          parse_mode: "Markdown",
          reply_markup: getUserKeyboard(pendingTargetId),
        });
      } catch { /* user blocked bot */ }
      await bot.sendMessage(chatId, ADMIN_BALANCE_ADDED(targetUser.firstName, amount), {
        parse_mode: "Markdown",
        reply_markup: adminMenuKeyboard(),
      });
      return;
    }

    if (text === ADMIN_BUTTONS.STATS) {
      await bot.sendMessage(
        chatId,
        STATS_MESSAGE(getUserCount(), getTokenCount(), getUnusedTokenCount()),
        { parse_mode: "Markdown", reply_markup: adminMenuKeyboard() }
      );
      return;
    }

    if (text === ADMIN_BUTTONS.BROADCAST) {
      setPendingBroadcast(userId);
      await bot.sendMessage(chatId, BROADCAST_PROMPT(), {
        parse_mode: "Markdown",
        reply_markup: removeKeyboard(),
      });
      return;
    }

    if (text === ADMIN_BUTTONS.ADD_BALANCE) {
      setPendingAdminBalance(userId);
      await bot.sendMessage(chatId, ADMIN_ADD_BALANCE_PROMPT(), {
        parse_mode: "Markdown",
        reply_markup: removeKeyboard(),
      });
      return;
    }

    if (text === ADMIN_BUTTONS.MENU_MANAGE) {
      await bot.sendMessage(chatId, "📋 *مدیریت منو*\n\nیک گزینه را انتخاب کنید:", {
        parse_mode: "Markdown",
        reply_markup: menuManageKeyboard(),
      });
      return;
    }

    if (text === ADMIN_BUTTONS.EXIT_ADMIN) {
      await sendUserMenu(chatId, userId, firstName);
      return;
    }

    if (text === MENU_MANAGE_BUTTONS.ADD_TOKEN) {
      const code = createToken(userId);
      await bot.sendMessage(chatId, TOKEN_CREATED_MESSAGE(code), {
        parse_mode: "Markdown",
        reply_markup: menuManageKeyboard(),
      });
      return;
    }

    if (text === MENU_MANAGE_BUTTONS.BACK) {
      await sendAdminPanel(chatId);
      return;
    }

    return;
  }

  // ─── BLOCKED USER SECTION ─────────────────────────────────────
  if (isUserBlocked(userId)) {
    if (text === USER_BUTTONS.SUPPORT || text === ACTIVATED_USER_BUTTONS.SUPPORT) {
      await bot.sendMessage(chatId, BLOCKED_SUPPORT_MESSAGE(), {
        parse_mode: "Markdown",
        reply_markup: blockedUserKeyboard(),
      });
    } else {
      await bot.sendMessage(chatId, BLOCKED_ONLY_SUPPORT(), {
        parse_mode: "Markdown",
        reply_markup: blockedUserKeyboard(),
      });
    }
    return;
  }

  // ─── USER SECTION ─────────────────────────────────────────────

  // Pending: entering deposit amount
  if (isPendingDepositAmount(userId)) {
    clearPendingDepositAmount(userId);
    const amount = parseInt(text.trim().replace(/,/g, ""), 10);
    if (isNaN(amount) || amount <= 0) {
      await bot.sendMessage(chatId, BALANCE_INVALID_AMOUNT(), {
        parse_mode: "Markdown",
        reply_markup: getUserKeyboard(userId),
      });
      return;
    }
    const depositReq = createDepositRequest(userId, amount);
    setPendingDepositReceipt(userId, depositReq.id);
    await bot.sendMessage(chatId, BALANCE_RECEIPT(depositReq.id, amount, CARD_NUMBER), {
      parse_mode: "Markdown",
      reply_markup: removeKeyboard(),
    });
    return;
  }

  if (isPendingTokenEntry(userId)) {
    clearPendingTokenEntry(userId);
    const result = validateAndUseToken(text, userId);

    if (result.valid) {
      await bot.sendMessage(chatId, TOKEN_SUCCESS_MESSAGE(firstName), {
        parse_mode: "Markdown",
        reply_markup: activatedUserKeyboard(),
      });
    } else if (result.reason === "already_used") {
      await bot.sendMessage(chatId, TOKEN_ALREADY_USED_MESSAGE(), {
        parse_mode: "Markdown",
        reply_markup: userMenuKeyboard(),
      });
    } else {
      await bot.sendMessage(chatId, TOKEN_INVALID_MESSAGE(), {
        parse_mode: "Markdown",
        reply_markup: userMenuKeyboard(),
      });
    }
    return;
  }

  if (text === USER_BUTTONS.ADD_TOKEN) {
    if (isUserActivated(userId)) {
      await bot.sendMessage(chatId, ALREADY_ACTIVATED_MESSAGE(), {
        parse_mode: "Markdown",
        reply_markup: activatedUserKeyboard(),
      });
      return;
    }
    setPendingTokenEntry(userId);
    await bot.sendMessage(chatId, TOKEN_ENTER_PROMPT(), {
      parse_mode: "Markdown",
      reply_markup: removeKeyboard(),
    });
    return;
  }

  if (text === ACTIVATED_USER_BUTTONS.BALANCE) {
    if (!isUserActivated(userId)) {
      await bot.sendMessage(chatId, "❌ این گزینه فقط برای کاربران فعال‌شده در دسترس است.", {
        parse_mode: "Markdown",
        reply_markup: getUserKeyboard(userId),
      });
      return;
    }
    setPendingDepositAmount(userId);
    await bot.sendMessage(chatId, BALANCE_ENTER_AMOUNT(), {
      parse_mode: "Markdown",
      reply_markup: removeKeyboard(),
    });
    return;
  }

  if (
    text === USER_BUTTONS.SUPPORT ||
    text === ACTIVATED_USER_BUTTONS.SUPPORT
  ) {
    await bot.sendMessage(chatId, SUPPORT_MESSAGE(), {
      parse_mode: "Markdown",
      reply_markup: getUserKeyboard(userId),
    });
    return;
  }

  if (text === ACTIVATED_USER_BUTTONS.FEATURES) {
    await bot.sendMessage(
      chatId,
      "🌟 *امکانات*\n\nامکانات بیشتر به زودی اضافه می‌شوند.",
      {
        parse_mode: "Markdown",
        reply_markup: activatedUserKeyboard(),
      }
    );
    return;
  }
});

bot.on("polling_error", (error) => {
  logger.error({ error }, "Telegram polling error");
});

logger.info("Telegram bot started");

export default bot;
