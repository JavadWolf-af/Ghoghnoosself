import type {
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
} from "node-telegram-bot-api";

export const BACK_BUTTON = "🔙 بازگشت";

export const USER_BUTTONS = {
  WALLET:       "💎 کیف پول",
  REFERRAL:     "🔗 دعوت از دوستان",
  PROFILE:      "👤 پروفایل",
  SUPPORT:      "🎧 پشتیبانی",
  OPEN_TICKETS: "🎫 تیکت‌های باز",
  TOKEN:        "🔑 فعال‌سازی توکن",
};

export const WALLET_BUTTONS = {
  ADD_BALANCE: "💳 افزایش موجودی",
  TRANSFER:    "↗️ انتقال اعتبار",
  BACK:        BACK_BUTTON,
};

export const ADMIN_BUTTONS = {
  MENU_MANAGE: "🛠 پنل مدیریت",
  EXIT_ADMIN:  "🚪 خروج از ادمین",
};

export const MANAGE_BUTTONS = {
  STATS:         "📊 آمار سیستم",
  BROADCAST:     "📣 پیام همگانی",
  ADD_TOKEN:     "🔑 توکن جدید",
  CARD_NUMBER:   "💳 شماره کارت",
  ADD_BALANCE:   "💰 افزودن موجودی",
  TRANSFER_USER: "↔️ انتقال اعتبار",
  OPEN_TICKETS:  "🎫 تیکت‌های باز",
  BLOCKED_LIST:  "🚫 لیست مسدودها",
  SEARCH_USER:   "🔍 جستجوی کاربر",
  BACK:          BACK_BUTTON,
};

// ── Reply Keyboards ───────────────────────────────────────────────────────────

export const userMainKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: USER_BUTTONS.WALLET },        { text: USER_BUTTONS.REFERRAL }],
    [{ text: USER_BUTTONS.PROFILE },       { text: USER_BUTTONS.SUPPORT }],
    [{ text: USER_BUTTONS.OPEN_TICKETS },  { text: USER_BUTTONS.TOKEN }],
  ],
  resize_keyboard: true,
});

export const blockedKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [[{ text: USER_BUTTONS.SUPPORT }]],
  resize_keyboard: true,
});

export const walletKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: WALLET_BUTTONS.ADD_BALANCE }, { text: WALLET_BUTTONS.TRANSFER }],
    [{ text: WALLET_BUTTONS.BACK }],
  ],
  resize_keyboard: true,
});

export const referralKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [[{ text: BACK_BUTTON }]],
  resize_keyboard: true,
});

export const profileKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [[{ text: BACK_BUTTON }]],
  resize_keyboard: true,
});

export const backKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [[{ text: BACK_BUTTON }]],
  resize_keyboard: true,
});

export const adminMainKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: ADMIN_BUTTONS.MENU_MANAGE }],
    [{ text: ADMIN_BUTTONS.EXIT_ADMIN }],
  ],
  resize_keyboard: true,
});

export const adminManageKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: MANAGE_BUTTONS.STATS },         { text: MANAGE_BUTTONS.BROADCAST }],
    [{ text: MANAGE_BUTTONS.ADD_TOKEN },     { text: MANAGE_BUTTONS.CARD_NUMBER }],
    [{ text: MANAGE_BUTTONS.ADD_BALANCE },   { text: MANAGE_BUTTONS.TRANSFER_USER }],
    [{ text: MANAGE_BUTTONS.OPEN_TICKETS },  { text: MANAGE_BUTTONS.BLOCKED_LIST }],
    [{ text: MANAGE_BUTTONS.SEARCH_USER }],
    [{ text: MANAGE_BUTTONS.BACK }],
  ],
  resize_keyboard: true,
});

// ── Inline Keyboards (User Navigation) ───────────────────────────────────────

export const userMainInlineKeyboard = (): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: "💎 کیف پول",          callback_data: "u_wallet"   }, { text: "🔗 دعوت از دوستان", callback_data: "u_referral" }],
    [{ text: "👤 پروفایل",           callback_data: "u_profile"  }, { text: "🎧 پشتیبانی",       callback_data: "u_support"  }],
    [{ text: "🎫 تیکت‌های باز",      callback_data: "u_tickets"  }, { text: "🔑 فعال‌سازی توکن", callback_data: "u_token"    }],
  ],
});

export const walletInlineKeyboard = (): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: "💳 افزایش موجودی", callback_data: "u_wallet_add" }, { text: "↗️ انتقال اعتبار", callback_data: "u_wallet_transfer" }],
    [{ text: "⬅️ بازگشت",        callback_data: "u_back" }],
  ],
});

export const backToMainInlineKeyboard = (): InlineKeyboardMarkup => ({
  inline_keyboard: [[{ text: "⬅️ بازگشت", callback_data: "u_back" }]],
});

export const backToWalletInlineKeyboard = (): InlineKeyboardMarkup => ({
  inline_keyboard: [[{ text: "⬅️ بازگشت به کیف پول", callback_data: "u_back_wallet" }]],
});

export const blockedInlineKeyboard = (): InlineKeyboardMarkup => ({
  inline_keyboard: [[{ text: "🎧 پشتیبانی", callback_data: "u_blocked_support" }]],
});

// ── Inline Keyboards (Admin Navigation) ──────────────────────────────────────

export const adminMainInlineKeyboard = (): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: "🛠 پنل مدیریت",  callback_data: "adm_manage" }],
    [{ text: "🚪 خروج از ادمین", callback_data: "adm_exit"   }],
  ],
});

export const adminManageInlineKeyboard = (): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: "📊 آمار سیستم",    callback_data: "adm_stats" },    { text: "📣 پیام همگانی",    callback_data: "adm_broadcast" }],
    [{ text: "🔑 توکن جدید",     callback_data: "adm_token" },    { text: "💳 شماره کارت",     callback_data: "adm_card"      }],
    [{ text: "💰 افزودن موجودی", callback_data: "adm_addbal" },   { text: "↔️ انتقال اعتبار", callback_data: "adm_transfer"  }],
    [{ text: "🎫 تیکت‌های باز",  callback_data: "adm_tickets" },  { text: "🚫 لیست مسدودها",  callback_data: "adm_blocked"   }],
    [{ text: "🔍 جستجوی کاربر",  callback_data: "adm_search"  }],
    [{ text: "⬅️ بازگشت",        callback_data: "adm_exit"    }],
  ],
});

export const adminBackInlineKeyboard = (): InlineKeyboardMarkup => ({
  inline_keyboard: [[{ text: "⬅️ بازگشت به مدیریت", callback_data: "adm_back_manage" }]],
});

// ── Inline Keyboards (Shared) ─────────────────────────────────────────────────

export const channelCheckKeyboard = (
  channelUrl: string,
  botUsername: string
): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: "📢 عضویت در کانال", url: channelUrl }],
    [{ text: "✅ عضو شدم — بررسی کن", url: `https://t.me/${botUsername}?start=checked` }],
  ],
});

export const depositReviewKeyboard = (requestId: string, userId: number): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: "✅ تأیید واریز",    callback_data: `dep_approve:${requestId}` },
      { text: "❌ رد درخواست",     callback_data: `dep_reject:${requestId}` },
    ],
    [
      { text: "💬 پیام به کاربر", callback_data: `dep_msg:${userId}` },
      { text: "⛔️ مسدود کردن",   callback_data: `dep_block:${userId}` },
    ],
  ],
});

export const unblockKeyboard = (userId: number): InlineKeyboardMarkup => ({
  inline_keyboard: [[
    { text: "🔓 رفع مسدودیت", callback_data: `unblock:${userId}` },
  ]],
});

export const ticketKeyboard = (ticketId: string): InlineKeyboardMarkup => ({
  inline_keyboard: [[
    { text: "✏️ پاسخ دادن", callback_data: `tkt_reply:${ticketId}` },
    { text: "🔒 بستن تیکت", callback_data: `tkt_close:${ticketId}` },
  ]],
});

export const adminUserActionKeyboard = (userId: number, isBlocked: boolean): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: "💰 افزودن موجودی",  callback_data: `usr_addbal:${userId}` },
      { text: "💬 پیام به کاربر",  callback_data: `dep_msg:${userId}` },
    ],
    [
      isBlocked
        ? { text: "🔓 رفع مسدودیت", callback_data: `unblock:${userId}` }
        : { text: "⛔️ مسدود کردن",  callback_data: `dep_block:${userId}` },
    ],
  ],
});
