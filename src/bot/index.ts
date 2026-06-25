import TelegramBot from "node-telegram-bot-api";
import { logger } from "../lib/logger";
import {
  userMainKeyboard, walletKeyboard, referralKeyboard, profileKeyboard,
  backKeyboard, adminMainKeyboard, adminManageKeyboard, channelCheckKeyboard,
  USER_BUTTONS, WALLET_BUTTONS, ADMIN_BUTTONS, MANAGE_BUTTONS, BACK_BUTTON,
} from "./keyboards";
import {
  WELCOME_MESSAGE, MAIN_MENU_MESSAGE, NOT_MEMBER_MESSAGE,
  ADMIN_PANEL_MESSAGE, ADMIN_MANAGE_MESSAGE, SUPPORT_MESSAGE,
  TOKEN_SECTION_MESSAGE, TOKEN_ENTER_PROMPT, TOKEN_SUCCESS_MESSAGE,
  TOKEN_INVALID_MESSAGE, TOKEN_ALREADY_USED_MESSAGE, TOKEN_CREATED_MESSAGE,
  WALLET_MESSAGE, ADD_BALANCE_MESSAGE, BALANCE_REQUEST_SENT,
  TRANSFER_PROMPT, TRANSFER_SUCCESS, TRANSFER_FAILED,
  REFERRAL_MESSAGE, PROFILE_MESSAGE,
  STATS_MESSAGE, BROADCAST_PROMPT, BROADCAST_SENT,
  CARD_NUMBER_PROMPT, CARD_NUMBER_SET,
  APPROVE_LIST_MESSAGE, APPROVE_SUCCESS, APPROVE_FAILED,
  ADMIN_TRANSFER_PROMPT, ADMIN_TRANSFER_SUCCESS,
} from "./messages";
import {
  addUser, getUser, getAllUsers, getUserCount, activateUser, isUserActivated,
  createToken, validateAndUseToken, getTokenCount, getUnusedTokenCount,
  getUserBalance, transferBalance,
  createBalanceRequest, getPendingBalanceRequests,
  approveBalanceRequest, rejectBalanceRequest,
  setCardNumber, getCardNumber,
  setPending, clearAllPending, isPending,
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
bot.getMe().then((me) => {
  BOT_USERNAME = me.username ?? "";
  logger.info({ username: BOT_USERNAME }, "Bot started");
});

// ── Helpers ────────────────────────────────────────────────────────
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

/** ارسال منوی اصلی کاربر */
async function sendMainMenu(chatId: number, firstName: string) {
  await safeSend(
    () => bot.sendMessage(chatId, MAIN_MENU_MESSAGE(firstName), {
      parse_mode: "Markdown",
      reply_markup: userMainKeyboard(),
    }),
    `mainMenu:${chatId}`
  );
}

/** ارسال پنل ادمین */
async function sendAdminPanel(chatId: number) {
  await safeSend(
    () => bot.sendMessage(chatId, ADMIN_PANEL_MESSAGE(), {
      parse_mode: "Markdown",
      reply_markup: adminMainKeyboard(),
    }),
    `admin:${chatId}`
  );
}

// ── /start ──────────────────────────────────────────────────────────
bot.onText(/\/start(.*)/, async (msg, match) => {
  try {
    const chatId    = msg.chat.id;
    const userId    = msg.from!.id;
    const firstName = msg.from!.first_name || "کاربر";
    const param     = (match?.[1] ?? "").trim();

    await delMsg(chatId, msg.message_id);
    clearAllPending(userId);

    // referral
    let referredBy: number | undefined;
    if (param.startsWith("REF")) {
      const refId = parseInt(param.replace("REF", ""), 10);
      if (!isNaN(refId) && refId !== userId) referredBy = refId;
    }

    addUser({ id: userId, firstName, lastName: msg.from!.last_name, username: msg.from!.username, referredBy });

    // ادمین: فعال‌سازی خودکار + پنل ادمین
    if (isAdmin(userId)) {
      if (!isUserActivated(userId)) activateUser(userId);
      await sendAdminPanel(chatId);
      return;
    }

    // کاربر عادی
    if (param === "checked") {
      // پس از کلیک روی "عضو شدم"
      if (await isMember(userId)) {
        await sendMainMenu(chatId, firstName);
      } else {
        await safeSend(() => bot.sendMessage(chatId, NOT_MEMBER_MESSAGE(), { parse_mode: "Markdown" }), `notMember:${chatId}`);
      }
      return;
    }

    // چک عضویت
    if (await isMember(userId)) {
      await sendMainMenu(chatId, firstName);
    } else {
      await safeSend(
        () => bot.sendMessage(chatId, WELCOME_MESSAGE(firstName), {
          parse_mode: "Markdown",
          reply_markup: channelCheckKeyboard(CHANNEL_URL, BOT_USERNAME),
        }),
        `welcome:${chatId}`
      );
    }
  } catch (err) { logger.error({ err }, "/start error"); }
});

// ── Messages ─────────────────────────────────────────────────────────
bot.on("message", async (msg) => {
  try {
    if (!msg.text && !msg.photo) return;
    if (msg.text?.startsWith("/")) return;

    const chatId    = msg.chat.id;
    const userId    = msg.from!.id;
    const firstName = msg.from!.first_name || "کاربر";
    const text      = msg.text ?? "";

    if (msg.text) await delMsg(chatId, msg.message_id);

    // ── بازگشت — همیشه کار می‌کند ──────────────────────────────────
    if (text === BACK_BUTTON) {
      clearAllPending(userId);
      if (isAdmin(userId)) await sendAdminPanel(chatId);
      else await sendMainMenu(chatId, firstName);
      return;
    }

    // بازگشت از زیر منوی مدیریت
    if (text === MANAGE_BUTTONS.BACK) {
      clearAllPending(userId);
      await sendAdminPanel(chatId);
      return;
    }

    // ══════════════════════════════════════════════════════════════════
    // ADMIN
    // ══════════════════════════════════════════════════════════════════
    if (isAdmin(userId)) {

      // --- pending states ---
      if (isPending(userId, "broadcast")) {
        if (!text) return;
        clearAllPending(userId);
        const allUsers = getAllUsers();
        let sent = 0;
        for (const u of allUsers) {
          const ok = await safeSend(
            () => bot.sendMessage(u.id, `📢 *پیام از مدیریت:*\n\n${text}`, { parse_mode: "Markdown" }),
            `bc:${u.id}`
          );
          if (ok) sent++;
          await new Promise((r) => setTimeout(r, 50));
        }
        await safeSend(
          () => bot.sendMessage(chatId, BROADCAST_SENT(sent), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }),
          `bcDone:${chatId}`
        );
        return;
      }

      if (isPending(userId, "tokenEntry")) {
        if (!text) return;
        clearAllPending(userId);
        // admin creates token directly
        const code = createToken(userId);
        await safeSend(
          () => bot.sendMessage(chatId, TOKEN_CREATED_MESSAGE(code), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }),
          `tokenCreated:${chatId}`
        );
        return;
      }

      if (isPending(userId, "cardNumberInput")) {
        if (!text) return;
        clearAllPending(userId);
        setCardNumber(text.trim());
        await safeSend(
          () => bot.sendMessage(chatId, CARD_NUMBER_SET(text.trim()), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }),
          `card:${chatId}`
        );
        return;
      }

      if (isPending(userId, "approveSelect")) {
        if (!text) return;
        const approveM = text.match(/^تایید\s+(\w+)$/i);
        const rejectM  = text.match(/^رد\s+(\w+)$/i);

        if (approveM) {
          const result = approveBalanceRequest(approveM[1]!);
          clearAllPending(userId);
          if (result.ok) {
            await safeSend(
              () => bot.sendMessage(result.userId!,
                `✅ *موجودی افزایش یافت*\n\n${result.amount!.toLocaleString("fa-IR")} تومان به کیف پول شما اضافه شد.`,
                { parse_mode: "Markdown" }),
              `notify:${result.userId}`
            );
            await safeSend(
              () => bot.sendMessage(chatId, APPROVE_SUCCESS(result.userId!, result.amount!), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }),
              `approveOk:${chatId}`
            );
          } else {
            await safeSend(
              () => bot.sendMessage(chatId, APPROVE_FAILED(), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }),
              `approveFail:${chatId}`
            );
          }
          return;
        }
        if (rejectM) {
          const ok = rejectBalanceRequest(rejectM[1]!);
          clearAllPending(userId);
          await safeSend(
            () => bot.sendMessage(chatId, ok ? `❌ درخواست رد شد.` : APPROVE_FAILED(), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }),
            `reject:${chatId}`
          );
          return;
        }
        await safeSend(
          () => bot.sendMessage(chatId, `فرمت: \`تایید [شناسه]\` یا \`رد [شناسه]\`\n\nبرای انصراف 🔙 را بزنید.`, { parse_mode: "Markdown" }),
          `remind:${chatId}`
        );
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
        await safeSend(
          () => bot.sendMessage(chatId,
            result.ok ? ADMIN_TRANSFER_SUCCESS(fromId, toId, amount) : TRANSFER_FAILED(result.reason ?? "unknown"),
            { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }),
          `atr:${chatId}`
        );
        return;
      }

      // --- admin menu buttons ---
      if (text === ADMIN_BUTTONS.MENU_MANAGE) {
        await safeSend(
          () => bot.sendMessage(chatId, ADMIN_MANAGE_MESSAGE(), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }),
          `manage:${chatId}`
        );
        return;
      }
      if (text === ADMIN_BUTTONS.EXIT_ADMIN) {
        await sendMainMenu(chatId, firstName);
        return;
      }

      // --- manage submenu buttons ---
      if (text === MANAGE_BUTTONS.STATS) {
        await safeSend(
          () => bot.sendMessage(chatId, STATS_MESSAGE(getUserCount(), getTokenCount(), getUnusedTokenCount()), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }),
          `stats:${chatId}`
        );
        return;
      }
      if (text === MANAGE_BUTTONS.BROADCAST) {
        setPending(userId, "broadcast");
        await safeSend(
          () => bot.sendMessage(chatId, BROADCAST_PROMPT(), { parse_mode: "Markdown", reply_markup: backKeyboard() }),
          `bcPrompt:${chatId}`
        );
        return;
      }
      if (text === MANAGE_BUTTONS.ADD_TOKEN) {
        const code = createToken(userId);
        await safeSend(
          () => bot.sendMessage(chatId, TOKEN_CREATED_MESSAGE(code), { parse_mode: "Markdown", reply_markup: adminManageKeyboard() }),
          `addToken:${chatId}`
        );
        return;
      }
      if (text === MANAGE_BUTTONS.CARD_NUMBER) {
        setPending(userId, "cardNumberInput");
        await safeSend(
          () => bot.sendMessage(chatId, CARD_NUMBER_PROMPT(), { parse_mode: "Markdown", reply_markup: backKeyboard() }),
          `cardPrompt:${chatId}`
        );
        return;
      }
      if (text === MANAGE_BUTTONS.APPROVE_BAL) {
        const requests = getPendingBalanceRequests();
        setPending(userId, "approveSelect");
        await safeSend(
          () => bot.sendMessage(chatId, APPROVE_LIST_MESSAGE(requests), { parse_mode: "Markdown", reply_markup: backKeyboard() }),
          `approveList:${chatId}`
        );
        return;
      }
      if (text === MANAGE_BUTTONS.TRANSFER_USER) {
        setPending(userId, "adminTransfer");
        await safeSend(
          () => bot.sendMessage(chatId, ADMIN_TRANSFER_PROMPT(), { parse_mode: "Markdown", reply_markup: backKeyboard() }),
          `atrPrompt:${chatId}`
        );
        return;
      }
      return;
    }

    // ══════════════════════════════════════════════════════════════════
    // USER (همه کاربران عضو کانال)
    // ══════════════════════════════════════════════════════════════════

    // pending: token entry
    if (isPending(userId, "tokenEntry")) {
      if (!text) return;
      clearAllPending(userId);
      const result = validateAndUseToken(text, userId);
      if (result.valid) {
        await safeSend(
          () => bot.sendMessage(chatId, TOKEN_SUCCESS_MESSAGE(firstName), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }),
          `tokenOk:${chatId}`
        );
      } else {
        const errMsg = result.reason === "already_used" ? TOKEN_ALREADY_USED_MESSAGE() : TOKEN_INVALID_MESSAGE();
        await safeSend(
          () => bot.sendMessage(chatId, errMsg, { parse_mode: "Markdown", reply_markup: userMainKeyboard() }),
          `tokenFail:${chatId}`
        );
      }
      return;
    }

    // pending: add balance (text)
    if (isPending(userId, "addBalance")) {
      if (!text) return;
      clearAllPending(userId);
      const amount = parseInt(text.replace(/\D/g, ""), 10) || 0;
      const reqId  = createBalanceRequest(userId, amount);
      for (const adminId of ADMIN_IDS) {
        await safeSend(
          () => bot.sendMessage(adminId,
            `📥 *درخواست افزایش موجودی*\n\nکاربر: \`${userId}\` (${firstName})\nمبلغ: ${amount > 0 ? amount.toLocaleString("fa-IR") + " تومان" : "نامشخص"}\nشناسه: \`${reqId}\`\n\nبرای تأیید: \`تایید ${reqId}\``,
            { parse_mode: "Markdown" }),
          `adminNotify:${adminId}`
        );
      }
      await safeSend(
        () => bot.sendMessage(chatId, BALANCE_REQUEST_SENT(), { parse_mode: "Markdown", reply_markup: walletKeyboard() }),
        `balanceSent:${chatId}`
      );
      return;
    }

    // pending: transfer
    if (isPending(userId, "transferInput")) {
      if (!text) return;
      clearAllPending(userId);
      const parts = text.trim().split(/\s+/);
      if (parts.length !== 2) {
        await safeSend(() => bot.sendMessage(chatId, TRANSFER_FAILED("invalid_format"), { parse_mode: "Markdown", reply_markup: walletKeyboard() }), `tr:${chatId}`);
        return;
      }
      const toId   = parseInt(parts[0]!, 10);
      const amount = parseInt(parts[1]!, 10);
      if (isNaN(toId) || isNaN(amount) || amount <= 0) {
        await safeSend(() => bot.sendMessage(chatId, TRANSFER_FAILED("invalid_amount"), { parse_mode: "Markdown", reply_markup: walletKeyboard() }), `tr:${chatId}`);
        return;
      }
      const result = transferBalance(userId, toId, amount);
      if (result.ok) {
        await safeSend(() => bot.sendMessage(chatId, TRANSFER_SUCCESS(toId, amount), { parse_mode: "Markdown", reply_markup: walletKeyboard() }), `trOk:${chatId}`);
        await safeSend(
          () => bot.sendMessage(toId, `💸 *اعتبار دریافت شد*\n\n${amount.toLocaleString("fa-IR")} تومان از کاربر \`${userId}\` دریافت کردید.`, { parse_mode: "Markdown" }),
          `trNotify:${toId}`
        );
      } else {
        await safeSend(() => bot.sendMessage(chatId, TRANSFER_FAILED(result.reason ?? "unknown"), { parse_mode: "Markdown", reply_markup: walletKeyboard() }), `trFail:${chatId}`);
      }
      return;
    }

    // ── User main menu buttons ───────────────────────────────────────
    if (text === USER_BUTTONS.WALLET) {
      await safeSend(
        () => bot.sendMessage(chatId, WALLET_MESSAGE(getUserBalance(userId)), { parse_mode: "Markdown", reply_markup: walletKeyboard() }),
        `wallet:${chatId}`
      );
      return;
    }

    if (text === WALLET_BUTTONS.ADD_BALANCE) {
      setPending(userId, "addBalance");
      await safeSend(
        () => bot.sendMessage(chatId, ADD_BALANCE_MESSAGE(getCardNumber()), { parse_mode: "Markdown", reply_markup: backKeyboard() }),
        `addBalance:${chatId}`
      );
      return;
    }

    if (text === WALLET_BUTTONS.TRANSFER) {
      if (getUserBalance(userId) <= 0) {
        await safeSend(() => bot.sendMessage(chatId, `❌ موجودی کافی ندارید.`, { parse_mode: "Markdown", reply_markup: walletKeyboard() }), `noBalance:${chatId}`);
        return;
      }
      setPending(userId, "transferInput");
      await safeSend(
        () => bot.sendMessage(chatId, TRANSFER_PROMPT(), { parse_mode: "Markdown", reply_markup: backKeyboard() }),
        `trPrompt:${chatId}`
      );
      return;
    }

    if (text === USER_BUTTONS.REFERRAL) {
      const user = getUser(userId);
      if (!user) { await sendMainMenu(chatId, firstName); return; }
      await safeSend(
        () => bot.sendMessage(chatId, REFERRAL_MESSAGE(user, BOT_USERNAME), { parse_mode: "Markdown", reply_markup: referralKeyboard() }),
        `referral:${chatId}`
      );
      return;
    }

    if (text === USER_BUTTONS.PROFILE) {
      const user = getUser(userId);
      if (!user) { await sendMainMenu(chatId, firstName); return; }
      await safeSend(
        () => bot.sendMessage(chatId, PROFILE_MESSAGE(user), { parse_mode: "Markdown", reply_markup: profileKeyboard() }),
        `profile:${chatId}`
      );
      return;
    }

    if (text === USER_BUTTONS.SUPPORT) {
      await safeSend(
        () => bot.sendMessage(chatId, SUPPORT_MESSAGE(), { parse_mode: "Markdown", reply_markup: userMainKeyboard() }),
        `support:${chatId}`
      );
      return;
    }

    if (text === USER_BUTTONS.TOKEN) {
      await safeSend(
        () => bot.sendMessage(chatId, TOKEN_SECTION_MESSAGE(), { parse_mode: "Markdown", reply_markup: backKeyboard() }),
        `tokenSection:${chatId}`
      );
      // اگر بعد از این پیام توکن وارد کرد
      setPending(userId, "tokenEntry");
      return;
    }

    // fallback
    await sendMainMenu(chatId, firstName);

  } catch (err) { logger.error({ err }, "message handler error"); }
});

// ── Photo (balance receipt) ──────────────────────────────────────────
bot.on("photo", async (msg) => {
  try {
    const chatId    = msg.chat.id;
    const userId    = msg.from!.id;
    const firstName = msg.from!.first_name || "کاربر";

    if (!isPending(userId, "addBalance")) return;
    clearAllPending(userId);

    const reqId = createBalanceRequest(userId, 0);
    for (const adminId of ADMIN_IDS) {
      await safeSend(
        () => bot.sendMessage(adminId,
          `📥 *رسید واریز*\n\nکاربر: \`${userId}\` (${firstName})\nشناسه: \`${reqId}\`\n\nبرای تأیید: \`تایید ${reqId}\``,
          { parse_mode: "Markdown" }),
        `adminNotify:${adminId}`
      );
      const fileId = msg.photo![msg.photo!.length - 1]!.file_id;
      await safeSend(
        () => bot.sendPhoto(adminId, fileId, { caption: `رسید از کاربر ${userId}` }),
        `adminPhoto:${adminId}`
      );
    }
    await safeSend(
      () => bot.sendMessage(chatId, BALANCE_REQUEST_SENT(), { parse_mode: "Markdown", reply_markup: walletKeyboard() }),
      `balanceSent:${chatId}`
    );
  } catch (err) { logger.error({ err }, "photo handler error"); }
});

bot.on("polling_error", (err) => logger.error({ err }, "polling error"));
bot.on("error",         (err) => logger.error({ err }, "bot error"));

logger.info("Telegram bot initialized");
export default bot;
