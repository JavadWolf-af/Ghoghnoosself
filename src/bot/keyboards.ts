import type {
    InlineKeyboardMarkup,
    ReplyKeyboardMarkup,
  } from "node-telegram-bot-api";

  // ── Reply Keyboard (Main nav — bottom of screen, persistent) ──────────────────
  // این کیبورد همیشه پایین صفحه نمایانه
  // ناوبری از طریق editMessageText انجام میشه (نه sendMessage) → کیبورد گوشی نمیاد

  export const mainReplyKeyboard = (): ReplyKeyboardMarkup => ({
    keyboard: [
      [{ text: "💎 کیف پول" },         { text: "🔗 دعوت از دوستان" }],
      [{ text: "👤 پروفایل" },          { text: "🎧 پشتیبانی" }],
      [{ text: "🎫 تیکت‌های باز" },     { text: "🔑 فعال‌سازی توکن" }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  });

  export const adminReplyKeyboard = (): ReplyKeyboardMarkup => ({
    keyboard: [
      [{ text: "🛠 پنل مدیریت" }],
      [{ text: "🚪 خروج از ادمین" }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  });

  // ── Inline Keyboards (Panel content — داخل پیام anchor) ──────────────────────

  export const userMainKeyboard = (): InlineKeyboardMarkup => ({
    inline_keyboard: [
      [{ text: "💎 کیف پول", callback_data: "nav:wallet" },       { text: "🔗 دعوت از دوستان", callback_data: "nav:referral" }],
      [{ text: "👤 پروفایل", callback_data: "nav:profile" },      { text: "🎧 پشتیبانی", callback_data: "nav:support" }],
      [{ text: "🎫 تیکت‌های باز", callback_data: "nav:tickets" }, { text: "🔑 فعال‌سازی توکن", callback_data: "nav:token" }],
    ],
  });

  export const walletKeyboard = (): InlineKeyboardMarkup => ({
    inline_keyboard: [
      [{ text: "💳 افزایش موجودی", callback_data: "nav:add_balance" }, { text: "↗️ انتقال اعتبار", callback_data: "nav:transfer" }],
      [{ text: "🔙 بازگشت", callback_data: "nav:back" }],
    ],
  });

  export const adminMainKeyboard = (): InlineKeyboardMarkup => ({
    inline_keyboard: [
      [{ text: "🛠 پنل مدیریت", callback_data: "nav:admin_manage" }],
      [{ text: "🚪 خروج از ادمین", callback_data: "nav:admin_exit" }],
    ],
  });

  export const adminManageKeyboard = (): InlineKeyboardMarkup => ({
    inline_keyboard: [
      [{ text: "📊 آمار سیستم", callback_data: "nav:manage_stats" },    { text: "📣 پیام همگانی", callback_data: "nav:manage_broadcast" }],
      [{ text: "🔑 توکن جدید", callback_data: "nav:manage_token" },     { text: "💳 شماره کارت", callback_data: "nav:manage_card" }],
      [{ text: "💰 افزودن موجودی", callback_data: "nav:manage_addbal" }, { text: "↔️ انتقال اعتبار", callback_data: "nav:manage_transfer" }],
      [{ text: "🎫 تیکت‌های باز", callback_data: "nav:manage_tickets" }, { text: "🚫 لیست مسدودها", callback_data: "nav:manage_blocked" }],
      [{ text: "🔍 جستجوی کاربر", callback_data: "nav:manage_search" }],
      [{ text: "🔙 بازگشت", callback_data: "nav:back" }],
    ],
  });

  export const cancelKeyboard = (): InlineKeyboardMarkup => ({
    inline_keyboard: [[{ text: "🔙 بازگشت / لغو", callback_data: "nav:back" }]],
  });

  // ── Reply Keyboard (Blocked users only) ──────────────────────────────────────
  export const blockedKeyboard = (): ReplyKeyboardMarkup => ({
    keyboard: [[{ text: "🎧 پشتیبانی" }]],
    resize_keyboard: true,
    is_persistent: true,
  });

  // ── Inline Keyboards (Admin Actions) ─────────────────────────────────────────

  export const depositReviewKeyboard = (requestId: string, userId: number): InlineKeyboardMarkup => ({
    inline_keyboard: [
      [
        { text: "✅ تأیید واریز",   callback_data: `dep_approve:${requestId}` },
        { text: "❌ رد درخواست",   callback_data: `dep_reject:${requestId}` },
      ],
      [
        { text: "💬 پیام به کاربر", callback_data: `dep_msg:${userId}` },
        { text: "⛔️ مسدود کردن",  callback_data: `dep_block:${userId}` },
      ],
    ],
  });

  export const ticketKeyboard = (ticketId: string): InlineKeyboardMarkup => ({
    inline_keyboard: [[
      { text: "✏️ پاسخ دادن", callback_data: `tkt_reply:${ticketId}` },
      { text: "🔒 بستن تیکت", callback_data: `tkt_close:${ticketId}` },
    ]],
  });

  export const unblockKeyboard = (userId: number): InlineKeyboardMarkup => ({
    inline_keyboard: [[{ text: "🔓 رفع مسدودیت", callback_data: `unblock:${userId}` }]],
  });

  export const adminUserActionKeyboard = (userId: number, isBlocked: boolean): InlineKeyboardMarkup => ({
    inline_keyboard: [
      [
        { text: "💰 افزودن موجودی", callback_data: `usr_addbal:${userId}` },
        { text: "💬 پیام به کاربر", callback_data: `dep_msg:${userId}` },
      ],
      [
        {
          text: isBlocked ? "🔓 رفع مسدودیت" : "⛔️ مسدود کردن",
          callback_data: isBlocked ? `unblock:${userId}` : `dep_block:${userId}`,
        },
      ],
    ],
  });

  export const broadcastConfirmKeyboard = (): InlineKeyboardMarkup => ({
    inline_keyboard: [[
      { text: "✅ تأیید و ارسال", callback_data: "bcast_confirm" },
      { text: "❌ لغو",            callback_data: "bcast_cancel" },
    ]],
  });

  export const channelCheckKeyboard = (
    channelUrl: string,
    botUsername: string
  ): InlineKeyboardMarkup => ({
    inline_keyboard: [
      [{ text: "📢 عضویت در کانال", url: channelUrl }],
      [{ text: "✅ عضو شدم — بررسی کن", url: `https://t.me/${botUsername}?start=checked` }],
    ],
  });

  // Button texts used for reply keyboard matching in message handler
  export const REPLY_BUTTONS = {
    WALLET:       "💎 کیف پول",
    REFERRAL:     "🔗 دعوت از دوستان",
    PROFILE:      "👤 پروفایل",
    SUPPORT:      "🎧 پشتیبانی",
    OPEN_TICKETS: "🎫 تیکت‌های باز",
    TOKEN:        "🔑 فعال‌سازی توکن",
    ADMIN_MANAGE: "🛠 پنل مدیریت",
    ADMIN_EXIT:   "🚪 خروج از ادمین",
  };
  