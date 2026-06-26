import type {
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
} from "node-telegram-bot-api";

export const BACK_BUTTON = "🔙 بازگشت";

export const USER_BUTTONS = {
  WALLET:   "💎 کیف پول",
  REFERRAL: "🔗 دعوت از دوستان",
  PROFILE:  "👤 پروفایل",
  SUPPORT:  "🎧 پشتیبانی",
  TOKEN:    "🔑 فعال‌سازی توکن",
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
  BLOCKED_LIST:  "🚫 لیست مسدودها",
  BACK:          BACK_BUTTON,
};

// ── Reply Keyboards ───────────────────────────────────────────────────────────

export const userMainKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: USER_BUTTONS.WALLET },  { text: USER_BUTTONS.REFERRAL }],
    [{ text: USER_BUTTONS.PROFILE }, { text: USER_BUTTONS.SUPPORT }],
    [{ text: USER_BUTTONS.TOKEN }],
  ],
  resize_keyboard: true,
  is_persistent: true,
});

export const blockedKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [[{ text: USER_BUTTONS.SUPPORT }]],
  resize_keyboard: true,
  is_persistent: true,
});

export const walletKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: WALLET_BUTTONS.ADD_BALANCE }, { text: WALLET_BUTTONS.TRANSFER }],
    [{ text: WALLET_BUTTONS.BACK }],
  ],
  resize_keyboard: true,
  is_persistent: true,
});

export const referralKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [[{ text: BACK_BUTTON }]],
  resize_keyboard: true,
  is_persistent: true,
});

export const profileKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [[{ text: BACK_BUTTON }]],
  resize_keyboard: true,
  is_persistent: true,
});

export const backKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [[{ text: BACK_BUTTON }]],
  resize_keyboard: true,
  is_persistent: true,
});

export const adminMainKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: ADMIN_BUTTONS.MENU_MANAGE }],
    [{ text: ADMIN_BUTTONS.EXIT_ADMIN }],
  ],
  resize_keyboard: true,
  is_persistent: true,
});

export const adminManageKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: MANAGE_BUTTONS.STATS },        { text: MANAGE_BUTTONS.BROADCAST }],
    [{ text: MANAGE_BUTTONS.ADD_TOKEN },    { text: MANAGE_BUTTONS.CARD_NUMBER }],
    [{ text: MANAGE_BUTTONS.ADD_BALANCE },  { text: MANAGE_BUTTONS.TRANSFER_USER }],
    [{ text: MANAGE_BUTTONS.BLOCKED_LIST }],
    [{ text: MANAGE_BUTTONS.BACK }],
  ],
  resize_keyboard: true,
  is_persistent: true,
});

// ── Inline Keyboards ──────────────────────────────────────────────────────────

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
