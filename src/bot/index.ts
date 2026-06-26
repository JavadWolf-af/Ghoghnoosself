import TelegramBot from "node-telegram-bot-api";
import { logger } from "../lib/logger";
import {
  userMainKeyboard, walletKeyboard,
  adminMainKeyboard, adminManageKeyboard,
  cancelKeyboard, blockedKeyboard,
  channelCheckKeyboard,
  depositReviewKeyboard, ticketKeyboard, unblockKeyboard, adminUserActionKeyboard,
  broadcastConfirmKeyboard,
} from "./keyboards";
import {
  WELCOME_MESSAGE, MAIN_MENU_MESSAGE, NOT_MEMBER_MESSAGE, MEMBERSHIP_CHECK_FAILED_MESSAGE,
  ADMIN_PANEL_MESSAGE, ADMIN_MANAGE_MESSAGE,
  SUPPORT_PROMPT, TICKET_CREATED_USER, TICKET_REPLY_USER, TICKET_CLOSED_USER, TICKET_ADDED_USER,
  ADMIN_NEW_TICKET, ADMIN_TICKET_FOLLOWUP, ADMIN_TICKET_REPLY_PROMPT,
  ADMIN_TICKET_REPLY_SENT, ADMIN_TICKET_CLOSED, ADMIN_TICKET_ALREADY_CLOSED,
  BLOCKED_SUPPORT_PROMPT, BLOCKED_SUPPORT_SENT, BLOCKED_ONLY_SUPPORT,
  TOKEN_SECTION_MESSAGE, TOKEN_SUCCESS_MESSAGE, TOKEN_ALREADY_ACTIVATED_MESSAGE,
  TOKEN_INVALID_MESSAGE, TOKEN_ALREADY_USED_MESSAGE, TOKEN_CREATED_MESSAGE,
  WALLET_MESSAGE, ADD_BALANCE_AMOUNT_PROMPT, ADD_BALANCE_RECEIPT, BALANCE_REQUEST_SENT,
  BALANCE_APPROVED_USER, BALANCE_REJECTED_USER,
  BLOCKED_MESSAGE, UNBLOCKED_MESSAGE,
  TRANSFER_PROMPT, TRANSFER_SUCCESS, TRANSFER_FAILED,
  REFERRAL_MESSAGE, PROFILE_MESSAGE,
  STATS_MESSAGE, BROADCAST_PROMPT, BROADCAST_SENT,
  CARD_NUMBER_PROMPT, CARD_HOLDER_PROMPT, CARD_BANK_PROMPT, CARD_INFO_SET, BLOCKED_LIST_MESSAGE,
  ADMIN_DEPOSIT_REVIEW, ADMIN_SUPPORT_FROM_BLOCKED,
  ADMIN_ADD_BALANCE_PROMPT, ADMIN_ADD_BALANCE_AMOUNT_PROMPT,
  ADMIN_BALANCE_ADDED, ADMIN_USER_NOT_FOUND, ADMIN_INVALID_ID,
  ADMIN_MSG_PROMPT, ADMIN_MSG_SENT,
  ADMIN_DEPOSIT_APPROVED, ADMIN_DEPOSIT_REJECTED,
  ADMIN_USER_BLOCKED, ADMIN_USER_UNBLOCKED,
  ADMIN_TRANSFER_PROMPT, ADMIN_TRANSFER_SUCCESS,
  ADMIN_TICKET_REMINDER,
  USER_NO_OPEN_TICKET, USER_OPEN_TICKET,
  ADMIN_OPEN_TICKETS_HEADER, ADMIN_OPEN_TICKET_ITEM,
  ADMIN_SEARCH_USER_PROMPT, ADMIN_SEARCH_USER_NOT_FOUND, ADMIN_USER_PROFILE_ADMIN,
} from "./messages";
import {
  addUser, getUser, getAllUsers, getBlockedUsers, getUserCount,
  isUserActivated, isUserBlocked, blockUser, unblockUser,
  createToken, validateAndUseToken, getTokenCount, getUnusedTokenCount,
  getUserBalance, addBalance, transferBalance,
  createBalanceRequest, getBalanceRequest, approveBalanceRequest, rejectBalanceRequest,
  setCardNumber, getCardNumber, setCardHolder, getCardHolder, setCardBank, getCardBank,
  setPendingCardNumber, getPendingCardNumber, setPendingCardHolder, getPendingCardHolder,
  createSupportTicket, getOpenTicketByUser, getSupportTicket, getAllOpenTickets, findUserByUsername,
  addTicketMessage, closeSupportTicket, getOpenTicketsCount,
  setPending, clearAllPending, isPending, isPendingAdminManage, isPendingWallet,
  setAddBalanceData, getAddBalanceData,
  setAdminBalanceTarget, getAdminBalanceTarget,
  setAdminMessageTarget, getAdminMessageTarget,
  setAdminTicketTarget, getAdminTicketTarget,
  getTicketsNeedingReminder, markTicketReminded,
} from "./store";

const BOT_TOKEN           = process.env["TELEGRAM_BOT_TOKEN"];
const CHANNEL_USERNAME    = process.env["CHANNEL_USERNAME"] || "@Ghoghnoosself";
const CHANNEL_URL         = process.env["CHANNEL_URL"] || "https://t.me/Ghoghnoosself";
const ADMIN_IDS           = (process.env["ADMIN_IDS"] || "")
  .split(",").filter(Boolean).map((id) => parseInt(id.trim(), 10));
const REMINDER_HOURS      = parseInt(process.env["TICKET_REMINDER_HOURS"] ?? "2", 10);
const REMINDER_THRESHOLD  = REMINDER_HOURS * 60 * 60 * 1000;
const CHECK_INTERVAL_MS   = 30 * 60 * 1000;

if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is required");

const bot = new TelegramBot(BOT_TOKEN, {
  polling: {
    interval: 300,
    autoStart: true,
    params: { timeout: 10, allowed_updates: ["message", "callback_query"] },
  },
});

bot.setMyCommands([
  { command: "start", description: "🏠 شروع / بازگشت به منوی اصلی" },
]).catch((err) => logger.warn({ err }, "Failed to set bot commands"));

let BOT_USERNAME = "";
bot.getMe().then((me) => { BOT_USERNAME = me.username ?? ""; logger.info({ username: BOT_USERNAME }, "Bot started"); });

// ── یادآوری تیکت‌های بی‌پاسخ ─────────────────────────────────────────────────
async function checkUnansweredTickets(): Promise<void> {
  const tickets = await getTicketsNeedingReminder(REMINDER_THRESHOLD);
  if (tickets.length === 0) return;
  for (const ticket of tickets) {
    const user    = await getUser(ticket.userId);
    const lastMsg = ticket.messages[ticket.messages.length - 1]!;
    const msgText = ADMIN_TICKET_REMINDER(
      ticket.id, ticket.userId,
      user?.firstName ?? String(ticket.userId),
      user?.username, lastMsg.text, REMINDER_HOURS,
    );
    for (const adminId of ADMIN_IDS) {
      try { await bot.sendMessage(adminId, msgText, { parse_mode: "Markdown", reply_markup: ticketKeyboard(ticket.id) }); }
      catch { /* ignore */ }
    }
    await markTicketReminded(ticket.id);
    await new Promise((r) => setTimeout(r, 100));
  }
}

setTimeout(() => {
  checkUnansweredTickets().catch((err) => logger.error({ err }, "Reminder check error"));
  setInterval(() => {
    checkUnansweredTickets().catch((err) => logger.error({ err }, "Reminder check error"));
  }, CHECK_INTERVAL_MS);
}, 5 * 60 * 1000);

// ── Panel message tracking ────────────────────────────────────────────────────
const panelMsgs = new Map<number, number[]>();
const pendingBroadcastText = new Map<number, string>();

async function deletePanelMsgs(chatId: number): Promise<void> {
  const ids = panelMsgs.get(chatId) ?? [];
  for (const id of ids) {
    try { await bot.deleteMessage(chatId, id); } catch { /* ignore */ }
  }
  panelMsgs.delete(chatId);
}

async function sendPanel(
  chatId: number,
  text: string,
  options: TelegramBot.SendMessageOptions,
): Promise<void> {
  await deletePanelMsgs(chatId);
  try {
    const sent = await bot.sendMessage(chatId, text, options);
    panelMsgs.set(chatId, [sent.message_id]);
  } catch (err: unknown) {
    const m = (err as { message?: string })?.message ?? "";
    if (m.includes("Too Many Requests")) {
      const wait = parseInt(m.match(/retry after (\d+)/)?.[1] ?? "5") * 1000;
      await new Promise((r) => setTimeout(r, wait));
      try {
        const sent = await bot.sendMessage(chatId, text, options);
        panelMsgs.set(chatId, [sent.message_id]);
      } catch { /* ignore */ }
    } else if (!m.includes("blocked") && !m.includes("deactivated") && !m.includes("chat not found")) {
      logger.error({ err, chatId }, "sendPanel error");
    }
  }
}

async function sendTracked(
  chatId: number,
  text: string,
  options?: TelegramBot.SendMessageOptions,
): Promise<void> {
  try {
    const sent = await bot.sendMessage(chatId, text, options ?? {});
    panelMsgs.set(chatId, [...(panelMsgs.get(chatId) ?? []), sent.message_id]);
  } catch (err: unknown) {
    const m = (err as { message?: string })?.message ?? "";
    if (m.includes("Too Many Requests")) {
      const wait = parseInt(m.match(/retry after (\d+)/)?.[1] ?? "5") * 1000;
      await new Promise((r) => setTimeout(r, wait));
      try {
        const sent = await bot.sendMessage(chatId, text, options ?? {});
        panelMsgs.set(chatId, [...(panelMsgs.get(chatId) ?? []), sent.message_id]);
      } catch { /* ignore */ }
    }
  }
}

async function safeSend(fn: () => Promise<unknown>, ctx: string): Promise<boolean> {
  try { await fn(); return true; } catch (err: unknown) {
    const m = (err as { message?: string })?.message ?? "";
    if (m.includes("blocked") || m.includes("deactivated") || m.includes("chat not found")) return false;
    if (m.includes("Too Many Requests")) {
      const wait = parseInt(m.match(/retry after (\d+)/)?.[1] ?? "5") * 1000;
      await new Promise((r) => setTimeout(r, wait));
      try { await fn(); return true; } catch { return false; }
    }
    logger.error({ err, ctx }, "safeSend error");
    return false;
  }
}

async function removeReplyKeyboard(chatId: number): Promise<void> {
  try {
    const tmp = await bot.sendMessage(chatId, ".", { reply_markup: { remove_keyboard: true } });
    await bot.deleteMessage(chatId, tmp.message_id);
  } catch { /* ignore */ }
}

function isAdmin(userId: number): boolean { return ADMIN_IDS.includes(userId); }

async function isMember(userId: number): Promise<{ member: boolean; failed: boolean }> {
  try {
    const m = await bot.getChatMember(CHANNEL_USERNAME, userId);
    return { member: ["member", "administrator", "creator"].includes(m.status), failed: false };
  } catch {
    logger.warn({ userId, channel: CHANNEL_USERNAME }, "Membership check failed");
    return { member: false, failed: true };
  }
}

async function delMsg(chatId: number, msgId: number) {
  try { await bot.deleteMessage(chatId, msgId); } catch { /* ignore */ }
}

// ── توابع ارسال پنل ──────────────────────────────────────────────────────────

async function sendMainMenu(chatId: number, firstName: string): Promise<void> {
  await removeReplyKeyboard(chatId);
  await sendPanel(chatId, MAIN_MENU_MESSAGE(firstName), { parse_mode: "Markdown", reply_markup: userMainKeyboard() });
}

async function sendWallet(chatId: number, userId: number): Promise<void> {
  await sendPanel(chatId, WALLET_MESSAGE(await getUserBalance(userId)), { parse_mode: "Markdown", reply_markup: walletKeyboard() });
}

async function sendAdminPanel(chatId: number): Promise<void> {
  await removeReplyKeyboard(chatId);
  await sendPanel(chatId, ADMIN_PANEL_MESSAGE(), { parse_mode: "Markdown", reply_markup: adminMainKeyboard() });
}

async function sendAdminManage(chatId: number): Promise<void> {
  await sendPanel(chatId, ADMIN_MANAGE_MESSAGE(), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() });
}

async function notifyAdminsDeposit(
  requestId: string, amount: number, userId: number,
  firstName: string, username: string | undefined, receiptFileId: string,
): Promise<void> {
  const caption = ADMIN_DEPOSIT_REVIEW(requestId, amount, userId, firstName, username);
  for (const adminId of ADMIN_IDS) {
    try {
      await bot.sendPhoto(adminId, receiptFileId, { caption, parse_mode: "Markdown", reply_markup: depositReviewKeyboard(requestId, userId) });
    } catch (err) { logger.warn({ adminId, err }, "Failed to notify admin of deposit"); }
  }
}

async function notifyAdminsTicket(
  ticketId: string, userId: number, firstName: string,
  username: string | undefined, text: string, isFollowup: boolean,
): Promise<void> {
  const msgText = isFollowup
    ? ADMIN_TICKET_FOLLOWUP(ticketId, userId, firstName, username, text)
    : ADMIN_NEW_TICKET(ticketId, userId, firstName, username, text);
  for (const adminId of ADMIN_IDS) {
    await safeSend(
      () => bot.sendMessage(adminId, msgText, { parse_mode: "Markdown", reply_markup: ticketKeyboard(ticketId) }),
      `ticket:${adminId}`,
    );
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

    await addUser({ id: userId, firstName, lastName: msg.from!.last_name, username: msg.from!.username, referredBy });

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
  const userId    = query.from.id;
  const firstName = query.from.first_name || "کاربر";
  const data      = query.data ?? "";
  const chatId    = query.message?.chat.id ?? userId;
  const msgId     = query.message?.message_id;

  await bot.answerCallbackQuery(query.id).catch(() => {});

  // ── Navigation (همه کاربران) ─────────────────────────────────────────────
  if (data.startsWith("nav:")) {
    const nav = data.replace("nav:", "");

    if (nav === "back") {
      if (isAdmin(userId)) {
        const fromManage = isPendingAdminManage(userId);
        clearAllPending(userId);
        if (fromManage) await sendAdminManage(chatId);
        else await sendAdminPanel(chatId);
      } else if (await isUserBlocked(userId)) {
        clearAllPending(userId);
        await bot.sendMessage(chatId, BLOCKED_ONLY_SUPPORT(), { parse_mode: "Markdown", reply_markup: blockedKeyboard() });
      } else {
        const fromWallet = isPendingWallet(userId);
        clearAllPending(userId);
        if (fromWallet) await sendWallet(chatId, userId);
        else await sendMainMenu(chatId, firstName);
      }
      return;
    }

    if (nav === "wallet") { await sendWallet(chatId, userId); return; }
    if (nav === "referral") {
      const user = await getUser(userId);
      if (!user) { await sendMainMenu(chatId, firstName); return; }
      await sendPanel(chatId, REFERRAL_MESSAGE(user, BOT_USERNAME), { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
      return;
    }
    if (nav === "profile") {
      const user = await getUser(userId);
      if (!user) { await sendMainMenu(chatId, firstName); return; }
      await sendPanel(chatId, PROFILE_MESSAGE(user), { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
      return;
    }
    if (nav === "support") {
      setPending(userId, "support");
      await sendPanel(chatId, SUPPORT_PROMPT(), { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
      return;
    }
    if (nav === "tickets") {
      const ticket = await getOpenTicketByUser(userId);
      if (!ticket) {
        await sendPanel(chatId, USER_NO_OPEN_TICKET(), { parse_mode: "Markdown", reply_markup: userMainKeyboard() });
      } else {
        await sendPanel(chatId, USER_OPEN_TICKET(ticket.id, ticket.createdAt, ticket.messages), { parse_mode: "Markdown", reply_markup: userMainKeyboard() });
      }
      return;
    }
    if (nav === "token") {
      if (await isUserActivated(userId)) {
        await sendPanel(chatId, TOKEN_ALREADY_ACTIVATED_MESSAGE(), { parse_mode: "Markdown", reply_markup: userMainKeyboard() });
        return;
      }
      setPending(userId, "tokenEntry");
      await sendPanel(chatId, TOKEN_SECTION_MESSAGE(), { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
      return;
    }
    if (nav === "add_balance") {
      setPending(userId, "addBalance");
      await sendPanel(chatId, ADD_BALANCE_AMOUNT_PROMPT(), { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
      return;
    }
    if (nav === "transfer") {
      if (await getUserBalance(userId) <= 0) {
        await sendWallet(chatId, userId);
        return;
      }
      setPending(userId, "transferInput");
      await sendPanel(chatId, TRANSFER_PROMPT(), { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
      return;
    }

    // Admin nav
    if (isAdmin(userId)) {
      if (nav === "admin_manage") { await sendAdminManage(chatId); return; }
      if (nav === "admin_stats") {
        const [userCount, tokenCount, unusedCount, openTickets] = await Promise.all([
          getUserCount(), getTokenCount(), getUnusedTokenCount(), getOpenTicketsCount(),
        ]);
        await sendPanel(chatId, STATS_MESSAGE(userCount, tokenCount, unusedCount, openTickets), { parse_mode: "Markdown", reply_markup: adminMainKeyboard() });
        return;
      }
      if (nav === "admin_broadcast") {
        setPending(userId, "broadcast");
        await sendPanel(chatId, BROADCAST_PROMPT(), { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
        return;
      }
      if (nav === "admin_create_token") {
        const code = await createToken(userId);
        await sendPanel(chatId, TOKEN_CREATED_MESSAGE(code), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() });
        return;
      }
      if (nav === "admin_set_card") {
        setPending(userId, "cardNumberInput");
        await sendPanel(chatId, CARD_NUMBER_PROMPT(), { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
        return;
      }
      if (nav === "admin_blocked_list") {
        const blocked = await getBlockedUsers();
        await sendPanel(chatId, BLOCKED_LIST_MESSAGE(blocked), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() });
        return;
      }
      if (nav === "admin_transfer") {
        setPending(userId, "adminTransfer");
        await sendPanel(chatId, ADMIN_TRANSFER_PROMPT(), { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
        return;
      }
      if (nav === "admin_add_balance") {
        setPending(userId, "adminAddBalance");
        await sendPanel(chatId, ADMIN_ADD_BALANCE_PROMPT(), { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
        return;
      }
      if (nav === "admin_message_user") {
        setPending(userId, "adminMessageUser");
        await sendPanel(chatId, ADMIN_MSG_PROMPT(), { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
        return;
      }
      if (nav === "admin_search_user") {
        setPending(userId, "adminSearchUser");
        await sendPanel(chatId, ADMIN_SEARCH_USER_PROMPT(), { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
        return;
      }
      if (nav === "admin_open_tickets") {
        const openTickets = await getAllOpenTickets();
        await sendPanel(chatId, ADMIN_OPEN_TICKETS_HEADER(openTickets.length), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() });
        for (const t of openTickets.slice(0, 10)) {
          const last = t.messages[t.messages.length - 1];
          if (!last) continue;
          await sendTracked(chatId,
            ADMIN_OPEN_TICKET_ITEM(t.id, t.userId,
              (await getUser(t.userId))?.firstName ?? String(t.userId),
              (await getUser(t.userId))?.username,
              t.createdAt, t.messages.length, last.from, last.text),
            { parse_mode: "Markdown", reply_markup: ticketKeyboard(t.id) },
          );
        }
        return;
      }
    }
    return;
  }

  // ── Admin action callbacks ─────────────────────────────────────────────────
  if (isAdmin(userId)) {
    if (data.startsWith("deposit:approve:")) {
      const requestId = data.replace("deposit:approve:", "");
      const result    = await approveBalanceRequest(requestId);
      if (result.ok && result.userId && result.amount) {
        const newBalance = await getUserBalance(result.userId);
        await safeSend(() => bot.sendMessage(result.userId!, BALANCE_APPROVED_USER(result.amount!, newBalance), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }), `approve:${result.userId}`);
        if (msgId) await bot.editMessageCaption(ADMIN_DEPOSIT_APPROVED(requestId), { chat_id: chatId, message_id: msgId, parse_mode: "Markdown" }).catch(() => {});
      }
      return;
    }
    if (data.startsWith("deposit:reject:")) {
      const requestId = data.replace("deposit:reject:", "");
      const req       = await getBalanceRequest(requestId);
      if (req) {
        await rejectBalanceRequest(requestId);
        await safeSend(() => bot.sendMessage(req.userId, BALANCE_REJECTED_USER(), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }), `reject:${req.userId}`);
        if (msgId) await bot.editMessageCaption(ADMIN_DEPOSIT_REJECTED(requestId), { chat_id: chatId, message_id: msgId, parse_mode: "Markdown" }).catch(() => {});
      }
      return;
    }
    if (data.startsWith("ticket:reply:")) {
      const ticketId = data.replace("ticket:reply:", "");
      setPending(userId, "ticketReply");
      setAdminTicketTarget(userId, ticketId);
      await sendPanel(chatId, ADMIN_TICKET_REPLY_PROMPT(ticketId), { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
      return;
    }
    if (data.startsWith("ticket:close:")) {
      const ticketId = data.replace("ticket:close:", "");
      const closed   = await closeSupportTicket(ticketId);
      const ticket   = await getSupportTicket(ticketId);
      if (closed && ticket) {
        await safeSend(() => bot.sendMessage(ticket.userId, TICKET_CLOSED_USER(ticketId), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }), `tktClose:${ticket.userId}`);
        await sendTracked(chatId, ADMIN_TICKET_CLOSED(ticketId), { parse_mode: "Markdown" });
      } else {
        await sendTracked(chatId, ADMIN_TICKET_ALREADY_CLOSED(ticketId), { parse_mode: "Markdown" });
      }
      return;
    }
    if (data.startsWith("user:block:")) {
      const targetId = parseInt(data.replace("user:block:", ""), 10);
      const target   = await getUser(targetId);
      if (target) {
        await blockUser(targetId);
        await safeSend(() => bot.sendMessage(targetId, BLOCKED_MESSAGE(), { parse_mode: "Markdown", reply_markup: blockedKeyboard() }), `block:${targetId}`);
        await sendTracked(chatId, ADMIN_USER_BLOCKED(target.firstName, targetId), { parse_mode: "Markdown" });
      }
      return;
    }
    if (data.startsWith("user:unblock:")) {
      const targetId = parseInt(data.replace("user:unblock:", ""), 10);
      const target   = await getUser(targetId);
      if (target) {
        await unblockUser(targetId);
        await safeSend(() => bot.sendMessage(targetId, UNBLOCKED_MESSAGE(), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }), `unblock:${targetId}`);
        await sendTracked(chatId, ADMIN_USER_UNBLOCKED(target.firstName, targetId), { parse_mode: "Markdown" });
      }
      return;
    }
    if (data.startsWith("user:msg:")) {
      const targetId = parseInt(data.replace("user:msg:", ""), 10);
      setAdminMessageTarget(userId, targetId);
      setPending(userId, "adminMessageUser");
      await sendPanel(chatId, ADMIN_MSG_PROMPT(), { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
      return;
    }
    if (data.startsWith("user:addbal:")) {
      const targetId = parseInt(data.replace("user:addbal:", ""), 10);
      const target   = await getUser(targetId);
      if (!target) {
        await sendTracked(chatId, ADMIN_USER_NOT_FOUND(), { parse_mode: "Markdown" });
        return;
      }
      setAdminBalanceTarget(userId, targetId);
      setPending(userId, "adminAddBalanceAmount");
      await sendPanel(chatId, ADMIN_ADD_BALANCE_AMOUNT_PROMPT(target.firstName), { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
      return;
    }
    if (data === "broadcast:confirm") {
      clearAllPending(userId);
      const text = pendingBroadcastText.get(chatId);
      pendingBroadcastText.delete(chatId);
      if (!text) { await sendAdminManage(chatId); return; }
      const allUsers = await getAllUsers();
      let count = 0;
      for (const u of allUsers) {
        const ok = await safeSend(() => bot.sendMessage(u.id, text, { parse_mode: "Markdown" }), `bc:${u.id}`);
        if (ok) count++;
        await new Promise((r) => setTimeout(r, 50));
      }
      await sendAdminManage(chatId);
      await sendTracked(chatId, BROADCAST_SENT(count), { parse_mode: "Markdown" });
      return;
    }
    if (data === "broadcast:cancel") {
      clearAllPending(userId);
      pendingBroadcastText.delete(chatId);
      await sendAdminManage(chatId);
      return;
    }
  }

  // ── User callbacks ────────────────────────────────────────────────────────
  if (data === "nav:cancel") {
    clearAllPending(userId);
    if (isAdmin(userId)) await sendAdminPanel(chatId);
    else await sendMainMenu(chatId, firstName);
    return;
  }
});

// ── Messages ──────────────────────────────────────────────────────────────────
bot.on("message", async (msg) => {
  if (!msg.from || msg.text?.startsWith("/")) return;

  try {
    const chatId    = msg.chat.id;
    const userId    = msg.from.id;
    const firstName = msg.from.first_name || "کاربر";
    const text      = msg.text ?? "";

    await delMsg(chatId, msg.message_id);

    // ── ADMIN pending states ───────────────────────────────────────────────
    if (isAdmin(userId)) {
      if (isPending(userId, "ticketReply")) {
        const ticketId = getAdminTicketTarget(userId);
        clearAllPending(userId);
        if (!ticketId) { await sendAdminManage(chatId); return; }
        const ticket = await getSupportTicket(ticketId);
        if (!ticket || ticket.status === "closed") {
          await sendAdminManage(chatId);
          await sendTracked(chatId, ADMIN_TICKET_ALREADY_CLOSED(ticketId ?? ""), { parse_mode: "Markdown" });
          return;
        }
        await addTicketMessage(ticketId, "admin", text);
        await safeSend(() => bot.sendMessage(ticket.userId, TICKET_REPLY_USER(ticketId, text), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }), `tktReply:${ticket.userId}`);
        await sendAdminManage(chatId);
        await sendTracked(chatId, ADMIN_TICKET_REPLY_SENT(ticketId), { parse_mode: "Markdown" });
        return;
      }
      if (isPending(userId, "broadcast")) {
        clearAllPending(userId);
        pendingBroadcastText.set(chatId, text);
        const sentMsg = await bot.sendMessage(chatId, `📣 *پیش‌نمایش پیام همگانی:*\n\n${text}`, { parse_mode: "Markdown", reply_markup: broadcastConfirmKeyboard() });
        panelMsgs.set(chatId, [...(panelMsgs.get(chatId) ?? []), sentMsg.message_id]);
        return;
      }
      if (isPending(userId, "cardNumberInput")) {
        const card = text.trim();
        setPendingCardNumber(userId, card);
        setPending(userId, "cardHolderInput");
        await sendPanel(chatId, CARD_HOLDER_PROMPT(card), { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
        return;
      }
      if (isPending(userId, "cardHolderInput")) {
        const card   = getPendingCardNumber(userId) ?? "";
        const holder = text.trim();
        setPendingCardHolder(userId, holder);
        setPending(userId, "cardBankInput");
        await sendPanel(chatId, CARD_BANK_PROMPT(card, holder), { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
        return;
      }
      if (isPending(userId, "cardBankInput")) {
        const card   = getPendingCardNumber(userId) ?? "";
        const holder = getPendingCardHolder(userId) ?? "";
        const bank   = text.trim();
        clearAllPending(userId);
        await setCardNumber(card);
        await setCardHolder(holder);
        await setCardBank(bank);
        await sendAdminManage(chatId);
        await sendTracked(chatId, CARD_INFO_SET(card, holder, bank), { parse_mode: "Markdown" });
        return;
      }
      if (isPending(userId, "adminMessageUser")) {
        const targetUserId = getAdminMessageTarget(userId);
        clearAllPending(userId);
        if (targetUserId !== undefined)
          await safeSend(() => bot.sendMessage(targetUserId, `📨 *پیام از پشتیبانی:*\n\n${text}`, { parse_mode: "Markdown" }), `msgUser:${targetUserId}`);
        await sendAdminManage(chatId);
        await sendTracked(chatId, ADMIN_MSG_SENT(), { parse_mode: "Markdown" });
        return;
      }
      if (isPending(userId, "adminSearchUser")) {
        clearAllPending(userId);
        const q = text.trim();
        const found = isNaN(Number(q)) ? await findUserByUsername(q) : await getUser(parseInt(q, 10));
        await sendAdminManage(chatId);
        if (!found) {
          await sendTracked(chatId, ADMIN_SEARCH_USER_NOT_FOUND(), { parse_mode: "Markdown" });
        } else {
          await sendTracked(chatId, ADMIN_USER_PROFILE_ADMIN(found), { parse_mode: "Markdown", reply_markup: adminUserActionKeyboard(found.id, found.isBlocked) });
        }
        return;
      }
      if (isPending(userId, "adminAddBalance")) {
        const targetId = parseInt(text.trim(), 10);
        if (isNaN(targetId)) {
          clearAllPending(userId);
          await sendAdminManage(chatId);
          await sendTracked(chatId, ADMIN_INVALID_ID(), { parse_mode: "Markdown" });
          return;
        }
        const targetUser = await getUser(targetId);
        if (!targetUser) {
          clearAllPending(userId);
          await sendAdminManage(chatId);
          await sendTracked(chatId, ADMIN_USER_NOT_FOUND(), { parse_mode: "Markdown" });
          return;
        }
        setPending(userId, "adminAddBalanceAmount");
        setAdminBalanceTarget(userId, targetId);
        await sendPanel(chatId, ADMIN_ADD_BALANCE_AMOUNT_PROMPT(targetUser.firstName), { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
        return;
      }
      if (isPending(userId, "adminAddBalanceAmount")) {
        const targetId = getAdminBalanceTarget(userId);
        clearAllPending(userId);
        if (targetId === undefined) { await sendAdminManage(chatId); return; }
        const amount = parseInt(text.trim().replace(/\D/g, ""), 10);
        if (!amount || amount <= 0) {
          await sendAdminManage(chatId);
          await sendTracked(chatId, "❌ مبلغ نامعتبر است.", { parse_mode: "Markdown" });
          return;
        }
        await addBalance(targetId, amount);
        const targetUser = await getUser(targetId);
        const newBalance = await getUserBalance(targetId);
        if (targetUser) {
          await safeSend(() => bot.sendMessage(targetId, BALANCE_APPROVED_USER(amount, newBalance), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }), `notify:${targetId}`);
          await sendAdminManage(chatId);
          await sendTracked(chatId, ADMIN_BALANCE_ADDED(targetUser.firstName, targetId, amount), { parse_mode: "Markdown" });
        }
        return;
      }
      if (isPending(userId, "adminTransfer")) {
        clearAllPending(userId);
        const parts = text.trim().split(/\s+/);
        if (parts.length !== 3) { await sendAdminManage(chatId); await sendTracked(chatId, TRANSFER_FAILED("invalid_format"), { parse_mode: "Markdown" }); return; }
        const fromId = parseInt(parts[0]!, 10);
        const toId   = parseInt(parts[1]!, 10);
        const amount = parseInt(parts[2]!, 10);
        if (isNaN(fromId) || isNaN(toId) || isNaN(amount) || amount <= 0) {
          await sendAdminManage(chatId); await sendTracked(chatId, TRANSFER_FAILED("invalid_amount"), { parse_mode: "Markdown" }); return;
        }
        const result = await transferBalance(fromId, toId, amount);
        await sendAdminManage(chatId);
        await sendTracked(chatId, result.ok ? ADMIN_TRANSFER_SUCCESS(fromId, toId, amount) : TRANSFER_FAILED(result.reason ?? "unknown"), { parse_mode: "Markdown" });
        return;
      }
      await sendAdminPanel(chatId);
      return;
    }

    // ── کاربران مسدود ────────────────────────────────────────────────────────
    if (await isUserBlocked(userId)) {
      if (isPending(userId, "blockedSupport")) {
        clearAllPending(userId);
        const user = await getUser(userId);
        for (const adminId of ADMIN_IDS) {
          await safeSend(() => bot.sendMessage(adminId, ADMIN_SUPPORT_FROM_BLOCKED(userId, firstName, user?.username, text), { parse_mode: "Markdown", reply_markup: unblockKeyboard(userId) }), `blockedSupport:${adminId}`);
        }
        await bot.sendMessage(chatId, BLOCKED_SUPPORT_SENT(), { parse_mode: "Markdown", reply_markup: blockedKeyboard() });
        return;
      }
      if (text === "🎧 پشتیبانی") {
        setPending(userId, "blockedSupport");
        await bot.sendMessage(chatId, BLOCKED_SUPPORT_PROMPT(), { parse_mode: "Markdown", reply_markup: blockedKeyboard() });
      } else {
        await bot.sendMessage(chatId, BLOCKED_ONLY_SUPPORT(), { parse_mode: "Markdown", reply_markup: blockedKeyboard() });
      }
      return;
    }

    // ── Photo — رسید واریز ────────────────────────────────────────────────────
    if (msg.photo && isPending(userId, "addBalance")) {
      const data = getAddBalanceData(userId);
      if (!data) { await sendPanel(chatId, "❌ لطفاً ابتدا مبلغ را وارد کنید.", { parse_mode: "Markdown", reply_markup: cancelKeyboard() }); return; }
      clearAllPending(userId);
      const fileId   = msg.photo[msg.photo.length - 1]!.file_id;
      const requestId = await createBalanceRequest(userId, data.amount);
      const user     = await getUser(userId);
      await notifyAdminsDeposit(requestId, data.amount, userId, user?.firstName ?? firstName, user?.username, fileId);
      await sendPanel(chatId, BALANCE_REQUEST_SENT(), { parse_mode: "Markdown", reply_markup: userMainKeyboard() });
      return;
    }

    // ── کاربران عادی — pending states ─────────────────────────────────────
    if (isPending(userId, "tokenEntry")) {
      clearAllPending(userId);
      if (await isUserActivated(userId)) { await sendPanel(chatId, TOKEN_ALREADY_ACTIVATED_MESSAGE(), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }); return; }
      const result = await validateAndUseToken(text, userId);
      const errMsg = result.reason === "already_used" ? TOKEN_ALREADY_USED_MESSAGE() : TOKEN_INVALID_MESSAGE();
      await sendPanel(chatId, result.valid ? TOKEN_SUCCESS_MESSAGE(firstName) : errMsg, { parse_mode: "Markdown", reply_markup: userMainKeyboard() });
      return;
    }
    if (isPending(userId, "support")) {
      clearAllPending(userId);
      const user = await getUser(userId);
      const existingTicket = await getOpenTicketByUser(userId);
      if (existingTicket) {
        await addTicketMessage(existingTicket.id, "user", text);
        await notifyAdminsTicket(existingTicket.id, userId, firstName, user?.username, text, true);
        await sendPanel(chatId, TICKET_ADDED_USER(existingTicket.id), { parse_mode: "Markdown", reply_markup: userMainKeyboard() });
      } else {
        const ticket = await createSupportTicket(userId, text);
        await notifyAdminsTicket(ticket.id, userId, firstName, user?.username, text, false);
        await sendPanel(chatId, TICKET_CREATED_USER(ticket.id), { parse_mode: "Markdown", reply_markup: userMainKeyboard() });
      }
      return;
    }
    if (isPending(userId, "addBalance")) {
      if (getAddBalanceData(userId)) {
        await sendPanel(chatId, "📸 لطفاً تصویر رسید واریز را ارسال کنید.", { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
        return;
      }
      const amount = parseInt(text.replace(/\D/g, ""), 10);
      if (!amount || amount <= 0) {
        await sendPanel(chatId, "❌ مبلغ نامعتبر است. یک عدد صحیح وارد کنید.", { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
        return;
      }
      const receiptId = Math.random().toString(36).slice(2, 10).toUpperCase();
      setAddBalanceData(userId, amount, receiptId);
      await sendPanel(chatId, ADD_BALANCE_RECEIPT(receiptId, amount, await getCardNumber(), await getCardHolder(), await getCardBank()), { parse_mode: "Markdown", reply_markup: cancelKeyboard() });
      return;
    }
    if (isPending(userId, "transferInput")) {
      clearAllPending(userId);
      const parts = text.trim().split(/\s+/);
      if (parts.length !== 2) { await sendPanel(chatId, TRANSFER_FAILED("invalid_format"), { parse_mode: "Markdown", reply_markup: walletKeyboard() }); return; }
      const toId   = parseInt(parts[0]!, 10);
      const amount = parseInt(parts[1]!, 10);
      if (isNaN(toId) || isNaN(amount) || amount <= 0) { await sendPanel(chatId, TRANSFER_FAILED("invalid_amount"), { parse_mode: "Markdown", reply_markup: walletKeyboard() }); return; }
      const result = await transferBalance(userId, toId, amount);
      if (result.ok) {
        await sendPanel(chatId, TRANSFER_SUCCESS(toId, amount), { parse_mode: "Markdown", reply_markup: walletKeyboard() });
        await safeSend(() => bot.sendMessage(toId, `💸 *اعتبار دریافت شد*\n\n${amount.toLocaleString("fa-IR")} تومان از کاربر \`${userId}\` دریافت کردید.`, { parse_mode: "Markdown" }), `trNotify:${toId}`);
      } else {
        await sendPanel(chatId, TRANSFER_FAILED(result.reason ?? "unknown"), { parse_mode: "Markdown", reply_markup: walletKeyboard() });
      }
      return;
    }

    await sendMainMenu(chatId, firstName);
  } catch (err) { logger.error({ err }, "message handler error"); }
});

bot.on("polling_error", (err) => logger.error({ err }, "polling error"));
bot.on("error",         (err) => logger.error({ err }, "bot error"));

logger.info("Telegram bot initialized");
export default bot;
