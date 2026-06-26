import TelegramBot from "node-telegram-bot-api";
  import { logger } from "../lib/logger";
  import {
    userMainKeyboard, walletKeyboard,
    adminMainKeyboard, adminManageKeyboard,
    mainReplyKeyboard, adminReplyKeyboard,
    cancelKeyboard, blockedKeyboard,
    channelCheckKeyboard,
    depositReviewKeyboard, ticketKeyboard, unblockKeyboard, adminUserActionKeyboard,
    broadcastConfirmKeyboard, REPLY_BUTTONS,
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
    CARD_NUMBER_PROMPT, CARD_NUMBER_SET, BLOCKED_LIST_MESSAGE,
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
    setCardNumber, getCardNumber,
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
    const tickets = getTicketsNeedingReminder(REMINDER_THRESHOLD);
    if (tickets.length === 0) return;
    for (const ticket of tickets) {
      const user    = getUser(ticket.userId);
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
      markTicketReminded(ticket.id);
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  setTimeout(() => {
    checkUnansweredTickets().catch((err) => logger.error({ err }, "Reminder check error"));
    setInterval(() => {
      checkUnansweredTickets().catch((err) => logger.error({ err }, "Reminder check error"));
    }, CHECK_INTERVAL_MS);
  }, 5 * 60 * 1000);

  // ── Anchor Message Tracking ───────────────────────────────────────────────────
  // هر کاربر یک "پیام anchor" دارد که برای ناوبری EDIT میشه (نه حذف+ارسال جدید)
  // این روش مانع از ظاهر شدن کیبورد گوشی میشه
  const anchorMsgMap = new Map<number, number>(); // chatId -> msgId

  // Extra messages (stats, ticket lists, etc.) that are NOT the anchor
  const extraMsgs = new Map<number, number[]>(); // chatId -> [msgIds]

  async function clearExtraMsgs(chatId: number): Promise<void> {
    const ids = extraMsgs.get(chatId) ?? [];
    for (const id of ids) {
      try { await bot.deleteMessage(chatId, id); } catch { /* ignore */ }
    }
    extraMsgs.delete(chatId);
  }

  function trackExtra(chatId: number, msgId: number): void {
    const existing = extraMsgs.get(chatId) ?? [];
    extraMsgs.set(chatId, [...existing, msgId]);
  }

  // ویرایش پیام anchor یا ارسال جدید اگر وجود نداشت
  async function editOrSendAnchor(
    chatId: number,
    text: string,
    markup: TelegramBot.InlineKeyboardMarkup
  ): Promise<void> {
    await clearExtraMsgs(chatId);
    const existingId = anchorMsgMap.get(chatId);
    if (existingId) {
      try {
        await bot.editMessageText(text, {
          chat_id: chatId,
          message_id: existingId,
          parse_mode: "Markdown",
          reply_markup: markup,
        });
        return;
      } catch { /* message gone or identical — fall through */ }
    }
    // ارسال اولیه
    try {
      const sent = await bot.sendMessage(chatId, text, { parse_mode: "Markdown", reply_markup: markup });
      anchorMsgMap.set(chatId, sent.message_id);
    } catch (err) { logger.error({ err, chatId }, "editOrSendAnchor error"); }
  }

  // ارسال پیام‌های اضافه (آمار، لیست تیکت، ...) — اینها anchor رو عوض نمیکنن
  async function sendExtra(
    chatId: number,
    text: string,
    options?: TelegramBot.SendMessageOptions
  ): Promise<void> {
    try {
      const sent = await bot.sendMessage(chatId, text, options ?? {});
      trackExtra(chatId, sent.message_id);
    } catch (err) {
      const errMsg = (err as { message?: string })?.message ?? "";
      if (errMsg.includes("Too Many Requests")) {
        const wait = parseInt(errMsg.match(/retry after (\d+)/)?.[1] ?? "5") * 1000;
        await new Promise((r) => setTimeout(r, wait));
        try {
          const sent = await bot.sendMessage(chatId, text, options ?? {});
          trackExtra(chatId, sent.message_id);
        } catch { /* ignore */ }
      }
    }
  }

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

  // تنظیم reply keyboard پایین صفحه (ارسال و حذف فوری — کیبورد ماندگار میشه)
  async function setupReplyKeyboard(chatId: number, keyboard: TelegramBot.ReplyKeyboardMarkup): Promise<void> {
    try {
      const msg = await bot.sendMessage(chatId, "‌", { reply_markup: keyboard });
      await bot.deleteMessage(chatId, msg.message_id);
    } catch { /* ignore */ }
  }

  function isAdmin(userId: number): boolean { return ADMIN_IDS.includes(userId); }

  async function isMember(userId: number): Promise<{ member: boolean; failed: boolean }> {
    try {
      const m = await bot.getChatMember(CHANNEL_USERNAME, userId);
      const member = ["member", "administrator", "creator"].includes(m.status);
      return { member, failed: false };
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
    await editOrSendAnchor(chatId, MAIN_MENU_MESSAGE(firstName), userMainKeyboard());
  }

  async function sendWallet(chatId: number, userId: number): Promise<void> {
    await editOrSendAnchor(chatId, WALLET_MESSAGE(getUserBalance(userId)), walletKeyboard());
  }

  async function sendAdminPanel(chatId: number): Promise<void> {
    await editOrSendAnchor(chatId, ADMIN_PANEL_MESSAGE(), adminMainKeyboard());
  }

  async function sendAdminManage(chatId: number): Promise<void> {
    await editOrSendAnchor(chatId, ADMIN_MANAGE_MESSAGE(), adminManageKeyboard());
  }

  async function sendTextInputPanel(chatId: number, text: string): Promise<void> {
    // برای ورودی متن: anchor رو با دکمه لغو ویرایش میکنیم
    await editOrSendAnchor(chatId, text, cancelKeyboard());
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

  async function notifyAdminsTicket(
    ticketId: string, userId: number, firstName: string,
    username: string | undefined, text: string, isFollowup: boolean
  ): Promise<void> {
    const msgText = isFollowup
      ? ADMIN_TICKET_FOLLOWUP(ticketId, userId, firstName, username, text)
      : ADMIN_NEW_TICKET(ticketId, userId, firstName, username, text);
    for (const adminId of ADMIN_IDS) {
      await safeSend(
        () => bot.sendMessage(adminId, msgText, { parse_mode: "Markdown", reply_markup: ticketKeyboard(ticketId) }),
        `ticket:${adminId}`
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

      addUser({ id: userId, firstName, lastName: msg.from!.last_name, username: msg.from!.username, referredBy });

      if (isAdmin(userId)) {
        // تنظیم reply keyboard پایین برای ادمین
        await setupReplyKeyboard(chatId, adminReplyKeyboard());
        await sendAdminPanel(chatId);
        return;
      }

      // تنظیم reply keyboard پایین برای کاربر (فقط اولین بار یا /start مجدد)
      await setupReplyKeyboard(chatId, mainReplyKeyboard());

      if (param === "checked") {
        const { member, failed } = await isMember(userId);
        if (failed) {
          await editOrSendAnchor(chatId, MEMBERSHIP_CHECK_FAILED_MESSAGE(), channelCheckKeyboard(CHANNEL_URL, BOT_USERNAME));
        } else if (member) {
          await sendMainMenu(chatId, firstName);
        } else {
          await editOrSendAnchor(chatId, NOT_MEMBER_MESSAGE(), channelCheckKeyboard(CHANNEL_URL, BOT_USERNAME));
        }
        return;
      }

      const { member, failed } = await isMember(userId);
      if (failed) {
        await editOrSendAnchor(chatId, MEMBERSHIP_CHECK_FAILED_MESSAGE(), channelCheckKeyboard(CHANNEL_URL, BOT_USERNAME));
      } else if (member) {
        await sendMainMenu(chatId, firstName);
      } else {
        await editOrSendAnchor(chatId, WELCOME_MESSAGE(firstName), channelCheckKeyboard(CHANNEL_URL, BOT_USERNAME));
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

    // ── ناوبری — همه کاربران ─────────────────────────────────────────────────
    if (data.startsWith("nav:")) {
      const nav = data.replace("nav:", "");

      if (nav === "back") {
        if (isAdmin(userId)) {
          const fromManage = isPendingAdminManage(userId);
          clearAllPending(userId);
          if (fromManage) await sendAdminManage(chatId);
          else await sendAdminPanel(chatId);
        } else if (isUserBlocked(userId)) {
          clearAllPending(userId);
          await editOrSendAnchor(chatId, BLOCKED_ONLY_SUPPORT(), cancelKeyboard());
        } else {
          const fromWallet = isPendingWallet(userId);
          clearAllPending(userId);
          if (fromWallet) await sendWallet(chatId, userId);
          else await sendMainMenu(chatId, firstName);
        }
        return;
      }

      if (nav === "wallet")      { await sendWallet(chatId, userId); return; }
      if (nav === "referral") {
        const user = getUser(userId);
        if (!user) { await sendMainMenu(chatId, firstName); return; }
        await editOrSendAnchor(chatId, REFERRAL_MESSAGE(user, BOT_USERNAME), cancelKeyboard());
        return;
      }
      if (nav === "profile") {
        const user = getUser(userId);
        if (!user) { await sendMainMenu(chatId, firstName); return; }
        await editOrSendAnchor(chatId, PROFILE_MESSAGE(user), cancelKeyboard());
        return;
      }
      if (nav === "support") {
        setPending(userId, "support");
        await sendTextInputPanel(chatId, SUPPORT_PROMPT());
        return;
      }
      if (nav === "tickets") {
        const ticket = getOpenTicketByUser(userId);
        if (!ticket) {
          await editOrSendAnchor(chatId, USER_NO_OPEN_TICKET(), userMainKeyboard());
        } else {
          await editOrSendAnchor(chatId, USER_OPEN_TICKET(ticket.id, ticket.createdAt, ticket.messages), userMainKeyboard());
        }
        return;
      }
      if (nav === "token") {
        if (isUserActivated(userId)) {
          await editOrSendAnchor(chatId, TOKEN_ALREADY_ACTIVATED_MESSAGE(), userMainKeyboard());
          return;
        }
        setPending(userId, "tokenEntry");
        await sendTextInputPanel(chatId, TOKEN_SECTION_MESSAGE());
        return;
      }
      if (nav === "add_balance") {
        setPending(userId, "addBalance");
        await sendTextInputPanel(chatId, ADD_BALANCE_AMOUNT_PROMPT());
        return;
      }
      if (nav === "transfer") {
        if (getUserBalance(userId) <= 0) {
          await sendWallet(chatId, userId);
          return;
        }
        setPending(userId, "transferInput");
        await sendTextInputPanel(chatId, TRANSFER_PROMPT());
        return;
      }

      // ── ادمین ────────────────────────────────────────────────────────────
      if (!isAdmin(userId)) return;

      if (nav === "admin_manage") { await sendAdminManage(chatId); return; }
      if (nav === "admin_exit")   { await setupReplyKeyboard(chatId, mainReplyKeyboard()); await sendMainMenu(chatId, firstName); return; }

      if (nav === "manage_stats") {
        await sendAdminManage(chatId);
        await sendExtra(chatId, STATS_MESSAGE(getUserCount(), getTokenCount(), getUnusedTokenCount(), getOpenTicketsCount()), { parse_mode: "Markdown" });
        return;
      }
      if (nav === "manage_broadcast") {
        setPending(userId, "broadcast");
        await sendTextInputPanel(chatId, BROADCAST_PROMPT());
        return;
      }
      if (nav === "manage_token") {
        const code = createToken(userId);
        await sendAdminManage(chatId);
        await sendExtra(chatId, TOKEN_CREATED_MESSAGE(code), { parse_mode: "Markdown" });
        return;
      }
      if (nav === "manage_card") {
        setPending(userId, "cardNumberInput");
        await sendTextInputPanel(chatId, CARD_NUMBER_PROMPT());
        return;
      }
      if (nav === "manage_addbal") {
        setPending(userId, "adminAddBalance");
        await sendTextInputPanel(chatId, ADMIN_ADD_BALANCE_PROMPT());
        return;
      }
      if (nav === "manage_transfer") {
        setPending(userId, "adminTransfer");
        await sendTextInputPanel(chatId, ADMIN_TRANSFER_PROMPT());
        return;
      }
      if (nav === "manage_blocked") {
        const blockedUsers = getBlockedUsers();
        await sendAdminManage(chatId);
        await sendExtra(chatId, BLOCKED_LIST_MESSAGE(blockedUsers), { parse_mode: "Markdown" });
        for (const u of blockedUsers) {
          const name  = u.firstName.replace(/[_*`[]/g, "\\$&");
          const uname = u.username ? ` (@${u.username.replace(/[_*`[]/g, "\\$&")})` : "";
          await sendExtra(chatId, `👤 *${name}*${uname} — \`${u.id}\``, {
            parse_mode: "Markdown",
            reply_markup: unblockKeyboard(u.id),
          });
        }
        return;
      }
      if (nav === "manage_search") {
        setPending(userId, "adminSearchUser");
        await sendTextInputPanel(chatId, ADMIN_SEARCH_USER_PROMPT());
        return;
      }
      if (nav === "manage_tickets") {
        const openTickets = getAllOpenTickets();
        await sendAdminManage(chatId);
        await sendExtra(chatId, ADMIN_OPEN_TICKETS_HEADER(openTickets.length), { parse_mode: "Markdown" });
        for (const ticket of openTickets) {
          const ticketUser = getUser(ticket.userId);
          const lastMsg    = ticket.messages[ticket.messages.length - 1]!;
          await sendExtra(chatId, ADMIN_OPEN_TICKET_ITEM(
            ticket.id, ticket.userId,
            ticketUser?.firstName ?? String(ticket.userId),
            ticketUser?.username,
            ticket.createdAt, ticket.messages.length,
            lastMsg.from, lastMsg.text,
          ), { parse_mode: "Markdown", reply_markup: ticketKeyboard(ticket.id) });
          await new Promise((r) => setTimeout(r, 80));
        }
        return;
      }
      return;
    }

    // ── عملیات ادمین ─────────────────────────────────────────────────────────
    if (!isAdmin(userId)) return;

    if (data.startsWith("tkt_reply:")) {
      const ticketId = data.replace("tkt_reply:", "");
      const ticket   = getSupportTicket(ticketId);
      if (!ticket) { await bot.sendMessage(chatId, "⚠️ تیکت پیدا نشد."); return; }
      if (ticket.status === "closed") { await bot.sendMessage(chatId, ADMIN_TICKET_ALREADY_CLOSED(ticketId), { parse_mode: "Markdown" }); return; }
      setPending(userId, "ticketReply");
      setAdminTicketTarget(userId, ticketId);
      await sendTextInputPanel(chatId, ADMIN_TICKET_REPLY_PROMPT(ticketId));
      return;
    }

    if (data.startsWith("tkt_close:")) {
      const ticketId = data.replace("tkt_close:", "");
      const ticket   = getSupportTicket(ticketId);
      if (!ticket) { await bot.sendMessage(chatId, "⚠️ تیکت پیدا نشد."); return; }
      if (!closeSupportTicket(ticketId)) { await bot.sendMessage(chatId, ADMIN_TICKET_ALREADY_CLOSED(ticketId), { parse_mode: "Markdown" }); return; }
      await safeSend(() => bot.sendMessage(ticket.userId, TICKET_CLOSED_USER(ticketId), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }), `ticketClose:${ticket.userId}`);
      if (msgId) await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: msgId }).catch(() => {});
      await bot.sendMessage(chatId, ADMIN_TICKET_CLOSED(ticketId), { parse_mode: "Markdown" });
      return;
    }

    if (data.startsWith("dep_approve:")) {
      const requestId = data.replace("dep_approve:", "");
      const result    = approveBalanceRequest(requestId);
      if (!result.ok) { await bot.sendMessage(chatId, "⚠️ این درخواست قبلاً پردازش شده است."); return; }
      const newBalance = getUserBalance(result.userId!);
      await safeSend(() => bot.sendMessage(result.userId!, BALANCE_APPROVED_USER(result.amount!, newBalance), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }), `notify:${result.userId}`);
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

    if (data.startsWith("usr_addbal:")) {
      const targetUserId = parseInt(data.replace("usr_addbal:", ""), 10);
      const targetUser   = getUser(targetUserId);
      if (!targetUser) { await bot.sendMessage(chatId, ADMIN_USER_NOT_FOUND(), { parse_mode: "Markdown" }); return; }
      setPending(userId, "adminAddBalanceAmount");
      setAdminBalanceTarget(userId, targetUserId);
      await sendTextInputPanel(chatId, ADMIN_ADD_BALANCE_AMOUNT_PROMPT(targetUser.firstName));
      return;
    }

    if (data.startsWith("dep_msg:")) {
      const targetUserId = parseInt(data.replace("dep_msg:", ""), 10);
      setPending(userId, "adminMessageUser");
      setAdminMessageTarget(userId, targetUserId);
      await sendTextInputPanel(chatId, ADMIN_MSG_PROMPT());
      return;
    }

    if (data.startsWith("dep_block:")) {
      const targetUserId = parseInt(data.replace("dep_block:", ""), 10);
      blockUser(targetUserId);
      const targetUser = getUser(targetUserId);
      await safeSend(() => bot.sendMessage(targetUserId, BLOCKED_MESSAGE(), { parse_mode: "Markdown", reply_markup: blockedKeyboard() }), `block:${targetUserId}`);
      if (msgId) await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: msgId }).catch(() => {});
      await bot.sendMessage(chatId, ADMIN_USER_BLOCKED(targetUser?.firstName ?? String(targetUserId), targetUserId), { parse_mode: "Markdown", reply_markup: unblockKeyboard(targetUserId) });
      return;
    }

    if (data.startsWith("unblock:")) {
      const targetUserId = parseInt(data.replace("unblock:", ""), 10);
      unblockUser(targetUserId);
      const targetUser = getUser(targetUserId);
      await safeSend(() => bot.sendMessage(targetUserId, UNBLOCKED_MESSAGE(), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }), `unblock:${targetUserId}`);
      if (msgId) await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: msgId }).catch(() => {});
      await bot.sendMessage(chatId, ADMIN_USER_UNBLOCKED(targetUser?.firstName ?? String(targetUserId), targetUserId), { parse_mode: "Markdown" });
      return;
    }

    if (data === "bcast_confirm" || data === "bcast_cancel") {
      if (msgId) await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: msgId }).catch(() => {});
      if (data === "bcast_cancel") { await sendAdminManage(chatId); return; }
      const text = (query.message as any)?._broadcastText as string | undefined ?? "";
      const users = getAllUsers();
      let sent = 0;
      for (const user of users) {
        const ok = await safeSend(() => bot.sendMessage(user.id, text, { parse_mode: "Markdown" }), `bcast:${user.id}`);
        if (ok) sent++;
        await new Promise((r) => setTimeout(r, 50));
      }
      await sendAdminManage(chatId);
      await sendExtra(chatId, BROADCAST_SENT(sent), { parse_mode: "Markdown" });
      return;
    }
  });

  // ── Photo (رسید واریز) ────────────────────────────────────────────────────────
  bot.on("photo", async (msg) => {
    try {
      const chatId    = msg.chat.id;
      const userId    = msg.from!.id;
      const firstName = msg.from!.first_name || "کاربر";

      if (isAdmin(userId)) return;
      if (!isPending(userId, "addBalance")) return;

      const balanceData = getAddBalanceData(userId);
      if (!balanceData) {
        await sendTextInputPanel(chatId, "⚠️ ابتدا مبلغ واریز را وارد کنید.");
        return;
      }
      clearAllPending(userId);
      await delMsg(chatId, msg.message_id);

      const fileId    = msg.photo![msg.photo!.length - 1]!.file_id;
      const requestId = createBalanceRequest(userId, balanceData.amount);
      const user      = getUser(userId);

      await notifyAdminsDeposit(requestId, balanceData.amount, userId, firstName, user?.username, fileId);
      await editOrSendAnchor(chatId, BALANCE_REQUEST_SENT(), walletKeyboard());
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

      // ── ADMIN ─────────────────────────────────────────────────────────────────
      if (isAdmin(userId)) {
        // دکمه‌های reply keyboard ادمین
        if (text === REPLY_BUTTONS.ADMIN_MANAGE) { await sendAdminManage(chatId); return; }
        if (text === REPLY_BUTTONS.ADMIN_EXIT)   { await setupReplyKeyboard(chatId, mainReplyKeyboard()); await sendMainMenu(chatId, firstName); return; }

        if (isPending(userId, "ticketReply")) {
          const ticketId = getAdminTicketTarget(userId);
          clearAllPending(userId);
          if (!ticketId) { await sendAdminManage(chatId); return; }
          const ticket = getSupportTicket(ticketId);
          if (!ticket || ticket.status === "closed") {
            await sendAdminManage(chatId);
            await sendExtra(chatId, ADMIN_TICKET_ALREADY_CLOSED(ticketId ?? ""), { parse_mode: "Markdown" });
            return;
          }
          addTicketMessage(ticketId, "admin", text);
          await safeSend(() => bot.sendMessage(ticket.userId, TICKET_REPLY_USER(ticketId, text), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }), `tktReply:${ticket.userId}`);
          await sendAdminManage(chatId);
          await sendExtra(chatId, ADMIN_TICKET_REPLY_SENT(ticketId), { parse_mode: "Markdown" });
          return;
        }

        if (isPending(userId, "broadcast")) {
          clearAllPending(userId);
          const sentMsg = await bot.sendMessage(chatId, `📣 *پیش‌نمایش پیام همگانی:*\n\n${text}`, {
            parse_mode: "Markdown",
            reply_markup: broadcastConfirmKeyboard(),
          });
          (sentMsg as any)._broadcastText = text;
          trackExtra(chatId, sentMsg.message_id);
          return;
        }

        if (isPending(userId, "cardNumberInput")) {
          clearAllPending(userId);
          setCardNumber(text.trim());
          await sendAdminManage(chatId);
          await sendExtra(chatId, CARD_NUMBER_SET(text.trim()), { parse_mode: "Markdown" });
          return;
        }

        if (isPending(userId, "adminMessageUser")) {
          const targetUserId = getAdminMessageTarget(userId);
          clearAllPending(userId);
          if (targetUserId !== undefined)
            await safeSend(() => bot.sendMessage(targetUserId, `📨 *پیام از پشتیبانی:*\n\n${text}`, { parse_mode: "Markdown" }), `msgUser:${targetUserId}`);
          await sendAdminManage(chatId);
          await sendExtra(chatId, ADMIN_MSG_SENT(), { parse_mode: "Markdown" });
          return;
        }

        if (isPending(userId, "adminSearchUser")) {
          clearAllPending(userId);
          const query = text.trim();
          const found = isNaN(Number(query)) ? findUserByUsername(query) : getUser(parseInt(query, 10));
          await sendAdminManage(chatId);
          if (!found) {
            await sendExtra(chatId, ADMIN_SEARCH_USER_NOT_FOUND(), { parse_mode: "Markdown" });
          } else {
            await sendExtra(chatId, ADMIN_USER_PROFILE_ADMIN(found), { parse_mode: "Markdown", reply_markup: adminUserActionKeyboard(found.id, found.isBlocked) });
          }
          return;
        }

        if (isPending(userId, "adminAddBalance")) {
          const targetId = parseInt(text.trim(), 10);
          if (isNaN(targetId)) {
            clearAllPending(userId);
            await sendAdminManage(chatId);
            await sendExtra(chatId, ADMIN_INVALID_ID(), { parse_mode: "Markdown" });
            return;
          }
          const targetUser = getUser(targetId);
          if (!targetUser) {
            clearAllPending(userId);
            await sendAdminManage(chatId);
            await sendExtra(chatId, ADMIN_USER_NOT_FOUND(), { parse_mode: "Markdown" });
            return;
          }
          setPending(userId, "adminAddBalanceAmount");
          setAdminBalanceTarget(userId, targetId);
          await sendTextInputPanel(chatId, ADMIN_ADD_BALANCE_AMOUNT_PROMPT(targetUser.firstName));
          return;
        }

        if (isPending(userId, "adminAddBalanceAmount")) {
          const targetId = getAdminBalanceTarget(userId);
          clearAllPending(userId);
          if (targetId === undefined) { await sendAdminManage(chatId); return; }
          const amount = parseInt(text.trim().replace(/\D/g, ""), 10);
          if (!amount || amount <= 0) {
            await sendAdminManage(chatId);
            await sendExtra(chatId, "❌ مبلغ نامعتبر است.", { parse_mode: "Markdown" });
            return;
          }
          addBalance(targetId, amount);
          const targetUser = getUser(targetId)!;
          const newBalance = getUserBalance(targetId);
          await safeSend(() => bot.sendMessage(targetId, BALANCE_APPROVED_USER(amount, newBalance), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }), `notify:${targetId}`);
          await sendAdminManage(chatId);
          await sendExtra(chatId, ADMIN_BALANCE_ADDED(targetUser.firstName, targetId, amount), { parse_mode: "Markdown" });
          return;
        }

        if (isPending(userId, "adminTransfer")) {
          clearAllPending(userId);
          const parts = text.trim().split(/\s+/);
          if (parts.length !== 3) { await sendAdminManage(chatId); await sendExtra(chatId, TRANSFER_FAILED("invalid_format"), { parse_mode: "Markdown" }); return; }
          const fromId = parseInt(parts[0]!, 10);
          const toId   = parseInt(parts[1]!, 10);
          const amount = parseInt(parts[2]!, 10);
          if (isNaN(fromId) || isNaN(toId) || isNaN(amount) || amount <= 0) {
            await sendAdminManage(chatId); await sendExtra(chatId, TRANSFER_FAILED("invalid_amount"), { parse_mode: "Markdown" }); return;
          }
          const result = transferBalance(fromId, toId, amount);
          await sendAdminManage(chatId);
          await sendExtra(chatId, result.ok ? ADMIN_TRANSFER_SUCCESS(fromId, toId, amount) : TRANSFER_FAILED(result.reason ?? "unknown"), { parse_mode: "Markdown" });
          return;
        }

        await sendAdminPanel(chatId);
        return;
      }

      // ── کاربران مسدود ────────────────────────────────────────────────────────
      if (isUserBlocked(userId)) {
        if (isPending(userId, "blockedSupport")) {
          clearAllPending(userId);
          const user = getUser(userId);
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

      // ── دکمه‌های reply keyboard کاربر ────────────────────────────────────────
      // این دکمه‌ها ANCHOR رو edit میکنن (نه sendMessage) → کیبورد گوشی نمیاد
      if (text === REPLY_BUTTONS.WALLET)       { await sendWallet(chatId, userId); return; }
      if (text === REPLY_BUTTONS.REFERRAL) {
        const user = getUser(userId);
        if (!user) { await sendMainMenu(chatId, firstName); return; }
        await editOrSendAnchor(chatId, REFERRAL_MESSAGE(user, BOT_USERNAME), cancelKeyboard());
        return;
      }
      if (text === REPLY_BUTTONS.PROFILE) {
        const user = getUser(userId);
        if (!user) { await sendMainMenu(chatId, firstName); return; }
        await editOrSendAnchor(chatId, PROFILE_MESSAGE(user), cancelKeyboard());
        return;
      }
      if (text === REPLY_BUTTONS.SUPPORT) {
        setPending(userId, "support");
        await sendTextInputPanel(chatId, SUPPORT_PROMPT());
        return;
      }
      if (text === REPLY_BUTTONS.OPEN_TICKETS) {
        const ticket = getOpenTicketByUser(userId);
        if (!ticket) {
          await editOrSendAnchor(chatId, USER_NO_OPEN_TICKET(), userMainKeyboard());
        } else {
          await editOrSendAnchor(chatId, USER_OPEN_TICKET(ticket.id, ticket.createdAt, ticket.messages), userMainKeyboard());
        }
        return;
      }
      if (text === REPLY_BUTTONS.TOKEN) {
        if (isUserActivated(userId)) {
          await editOrSendAnchor(chatId, TOKEN_ALREADY_ACTIVATED_MESSAGE(), userMainKeyboard());
          return;
        }
        setPending(userId, "tokenEntry");
        await sendTextInputPanel(chatId, TOKEN_SECTION_MESSAGE());
        return;
      }

      // ── pending states کاربر (ورودی متن) ─────────────────────────────────────
      if (isPending(userId, "tokenEntry")) {
        clearAllPending(userId);
        if (isUserActivated(userId)) { await editOrSendAnchor(chatId, TOKEN_ALREADY_ACTIVATED_MESSAGE(), userMainKeyboard()); return; }
        const result = validateAndUseToken(text, userId);
        if (result.valid) {
          await editOrSendAnchor(chatId, TOKEN_SUCCESS_MESSAGE(firstName), userMainKeyboard());
        } else {
          const errMsg = result.reason === "already_used" ? TOKEN_ALREADY_USED_MESSAGE() : TOKEN_INVALID_MESSAGE();
          await editOrSendAnchor(chatId, errMsg, userMainKeyboard());
        }
        return;
      }

      if (isPending(userId, "support")) {
        clearAllPending(userId);
        const user = getUser(userId);
        const existingTicket = getOpenTicketByUser(userId);
        if (existingTicket) {
          addTicketMessage(existingTicket.id, "user", text);
          await notifyAdminsTicket(existingTicket.id, userId, firstName, user?.username, text, true);
          await editOrSendAnchor(chatId, TICKET_ADDED_USER(existingTicket.id), userMainKeyboard());
        } else {
          const ticket = createSupportTicket(userId, text);
          await notifyAdminsTicket(ticket.id, userId, firstName, user?.username, text, false);
          await editOrSendAnchor(chatId, TICKET_CREATED_USER(ticket.id), userMainKeyboard());
        }
        return;
      }

      if (isPending(userId, "addBalance")) {
        if (getAddBalanceData(userId)) {
          await sendTextInputPanel(chatId, "📸 لطفاً تصویر رسید واریز را ارسال کنید.\nبرای لغو دکمه بازگشت را بزنید.");
          return;
        }
        const amount = parseInt(text.replace(/\D/g, ""), 10);
        if (!amount || amount <= 0) {
          await sendTextInputPanel(chatId, "❌ مبلغ نامعتبر است. یک عدد صحیح وارد کنید.");
          return;
        }
        const receiptId = Math.random().toString(36).slice(2, 10).toUpperCase();
        setAddBalanceData(userId, amount, receiptId);
        await editOrSendAnchor(chatId, ADD_BALANCE_RECEIPT(receiptId, amount, getCardNumber()), cancelKeyboard());
        return;
      }

      if (isPending(userId, "transferInput")) {
        clearAllPending(userId);
        const parts = text.trim().split(/\s+/);
        if (parts.length !== 2) { await editOrSendAnchor(chatId, TRANSFER_FAILED("invalid_format"), walletKeyboard()); return; }
        const toId   = parseInt(parts[0]!, 10);
        const amount = parseInt(parts[1]!, 10);
        if (isNaN(toId) || isNaN(amount) || amount <= 0) { await editOrSendAnchor(chatId, TRANSFER_FAILED("invalid_amount"), walletKeyboard()); return; }
        const result = transferBalance(userId, toId, amount);
        if (result.ok) {
          await editOrSendAnchor(chatId, TRANSFER_SUCCESS(toId, amount), walletKeyboard());
          await safeSend(() => bot.sendMessage(toId, `💸 *اعتبار دریافت شد*\n\n${amount.toLocaleString("fa-IR")} تومان از کاربر \`${userId}\` دریافت کردید.`, { parse_mode: "Markdown" }), `trNotify:${toId}`);
        } else {
          await editOrSendAnchor(chatId, TRANSFER_FAILED(result.reason ?? "unknown"), walletKeyboard());
        }
        return;
      }

      // هیچ pending نیست → نمایش منوی اصلی
      await sendMainMenu(chatId, firstName);
    } catch (err) { logger.error({ err }, "message handler error"); }
  });

  bot.on("polling_error", (err) => logger.error({ err }, "polling error"));
  bot.on("error",         (err) => logger.error({ err }, "bot error"));

  logger.info("Telegram bot initialized");
  export default bot;
  