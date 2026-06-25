import type {
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
} from "node-telegram-bot-api";

export const BACK_BUTTON = "🔙 بازگشت";

// ── User buttons ──────────────────────────────────────────────────
export const USER_BUTTONS = {
  WALLET:   "💰 کیف پول",
  REFERRAL: "👥 زیر مجموعه گیری",
  PROFILE:  "👤 پروفایل",
  SUPPORT:  "📞 پشتیبانی",
  TOKEN:    "⭐ افزودن توکن",
};

// ── Wallet sub-menu ───────────────────────────────────────────────
export const WALLET_BUTTONS = {
  ADD_BALANCE: "➕ افزایش موجودی",
  TRANSFER:    "💸 انتقال اعتبار",
  BACK:        BACK_BUTTON,
};

// ── Admin buttons ─────────────────────────────────────────────────
export const ADMIN_BUTTONS = {
  MENU_MANAGE: "📋 مدیریت منو",
  EXIT_ADMIN:  "🚪 خروج از پنل ادمین",
};

// ── Admin manage submenu ──────────────────────────────────────────
export const MANAGE_BUTTONS = {
  STATS:         "📊 آمار کاربران",
  BROADCAST:     "📢 ارسال پیام همگانی",
  ADD_TOKEN:     "➕ افزودن توکن",
  CARD_NUMBER:   "💳 تنظیم شماره کارت",
  ADD_BALANCE:   "💰 افزایش موجودی",
  TRANSFER_USER: "💸 انتقال اعتبار کاربر",
  BACK:          BACK_BUTTON,
};

// ── Keyboards ─────────────────────────────────────────────────────

/** منوی اصلی کاربر */
export const userMainKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: USER_BUTTONS.WALLET },   { text: USER_BUTTONS.REFERRAL }],
    [{ text: USER_BUTTONS.PROFILE },  { text: USER_BUTTONS.SUPPORT }],
    [{ text: USER_BUTTONS.TOKEN }],
  ],
  resize_keyboard: true,
  is_persistent: true,
});

/** منوی کاربر بلاک‌شده — فقط پشتیبانی */
export const blockedKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [[{ text: USER_BUTTONS.SUPPORT }]],
  resize_keyboard: true,
  is_persistent: true,
});

/** کیف پول */
export const walletKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: WALLET_BUTTONS.ADD_BALANCE }],
    [{ text: WALLET_BUTTONS.TRANSFER }],
    [{ text: WALLET_BUTTONS.BACK }],
  ],
  resize_keyboard: true,
  is_persistent: true,
});

/** زیرمجموعه‌گیری */
export const referralKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [[{ text: BACK_BUTTON }]],
  resize_keyboard: true,
  is_persistent: true,
});

/** پروفایل */
export const profileKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [[{ text: BACK_BUTTON }]],
  resize_keyboard: true,
  is_persistent: true,
});

/** فقط بازگشت */
export const backKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [[{ text: BACK_BUTTON }]],
  resize_keyboard: true,
  is_persistent: true,
});

/** پنل اصلی ادمین */
export const adminMainKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: ADMIN_BUTTONS.MENU_MANAGE }],
    [{ text: ADMIN_BUTTONS.EXIT_ADMIN }],
  ],
  resize_keyboard: true,
  is_persistent: true,
});

/** زیر منوی مدیریت */
export const adminManageKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: MANAGE_BUTTONS.STATS },       { text: MANAGE_BUTTONS.BROADCAST }],
    [{ text: MANAGE_BUTTONS.ADD_TOKEN },   { text: MANAGE_BUTTONS.CARD_NUMBER }],
    [{ text: MANAGE_BUTTONS.ADD_BALANCE }, { text: MANAGE_BUTTONS.TRANSFER_USER }],
    [{ text: MANAGE_BUTTONS.BACK }],
  ],
  resize_keyboard: true,
  is_persistent: true,
});

/** کیبورد چک عضویت کانال */
export const channelCheckKeyboard = (
  channelUrl: string,
  botUsername: string
): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: "📢 عضویت در کانال", url: channelUrl }],
    [{ text: "✅ عضو شدم", url: `https://t.me/${botUsername}?start=checked` }],
  ],
});

/** کیبورد inline بررسی رسید واریز توسط ادمین */
export const depositReviewKeyboard = (requestId: string, userId: number): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: "✅ تایید موجودی", callback_data: `dep_approve:${requestId}` },
      { text: "❌ رد درخواست",   callback_data: `dep_reject:${requestId}` },
    ],
    [
      { text: "📨 پیام به کاربر", callback_data: `dep_msg:${userId}` },
      { text: "🚫 بلاک کاربر",   callback_data: `dep_block:${userId}` },
    ],
  ],
});

/** دکمه آزادسازی کاربر */
export const unblockKeyboard = (userId: number): InlineKeyboardMarkup => ({
  inline_keyboard: [[{ text: "🔓 آزاد کردن کاربر", callback_data: `unblock:${userId}` }]],
});
