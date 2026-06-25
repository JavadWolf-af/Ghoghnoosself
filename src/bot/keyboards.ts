import type {
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
} from "node-telegram-bot-api";

export const BACK_BUTTON     = "🔙 بازگشت";
export const MINIMIZE_BUTTON = "🔽 بستن منو";

export const USER_BUTTONS = {
  WALLET:   "💰 کیف پول",
  REFERRAL: "👥 زیر مجموعه گیری",
  PROFILE:  "👤 پروفایل",
  SUPPORT:  "📞 پشتیبانی",
  TOKEN:    "⭐ افزودن توکن",
  MINIMIZE: MINIMIZE_BUTTON,
};

export const WALLET_BUTTONS = {
  ADD_BALANCE: "➕ افزایش موجودی",
  TRANSFER:    "💸 انتقال اعتبار",
  BACK:        BACK_BUTTON,
};

export const ADMIN_BUTTONS = {
  MENU_MANAGE: "📋 مدیریت منو",
  EXIT_ADMIN:  "🚪 خروج از پنل ادمین",
  MINIMIZE:    MINIMIZE_BUTTON,
};

export const MANAGE_BUTTONS = {
  STATS:         "📊 آمار کاربران",
  BROADCAST:     "📢 ارسال پیام همگانی",
  ADD_TOKEN:     "➕ افزودن توکن",
  CARD_NUMBER:   "💳 تنظیم شماره کارت",
  ADD_BALANCE:   "💰 افزایش موجودی",
  TRANSFER_USER: "💸 انتقال اعتبار کاربر",
  BLOCKED_LIST:  "🚫 لیست مسدود شده‌ها",
  BACK:          BACK_BUTTON,
};

export const userMainKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: USER_BUTTONS.WALLET },   { text: USER_BUTTONS.REFERRAL }],
    [{ text: USER_BUTTONS.PROFILE },  { text: USER_BUTTONS.SUPPORT }],
    [{ text: USER_BUTTONS.TOKEN },    { text: USER_BUTTONS.MINIMIZE }],
  ],
  resize_keyboard: true,
  is_persistent: true,
});

export const blockedKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: USER_BUTTONS.SUPPORT }],
    [{ text: USER_BUTTONS.MINIMIZE }],
  ],
  resize_keyboard: true,
  is_persistent: true,
});

export const walletKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: WALLET_BUTTONS.ADD_BALANCE }],
    [{ text: WALLET_BUTTONS.TRANSFER }],
    [{ text: WALLET_BUTTONS.BACK },     { text: USER_BUTTONS.MINIMIZE }],
  ],
  resize_keyboard: true,
  is_persistent: true,
});

export const referralKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [[{ text: BACK_BUTTON }, { text: USER_BUTTONS.MINIMIZE }]],
  resize_keyboard: true,
  is_persistent: true,
});

export const profileKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [[{ text: BACK_BUTTON }, { text: USER_BUTTONS.MINIMIZE }]],
  resize_keyboard: true,
  is_persistent: true,
});

export const backKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [[{ text: BACK_BUTTON }, { text: USER_BUTTONS.MINIMIZE }]],
  resize_keyboard: true,
  is_persistent: true,
});

export const adminMainKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: ADMIN_BUTTONS.MENU_MANAGE }],
    [{ text: ADMIN_BUTTONS.EXIT_ADMIN }, { text: ADMIN_BUTTONS.MINIMIZE }],
  ],
  resize_keyboard: true,
  is_persistent: true,
});

export const adminManageKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: MANAGE_BUTTONS.STATS },         { text: MANAGE_BUTTONS.BROADCAST }],
    [{ text: MANAGE_BUTTONS.ADD_TOKEN },     { text: MANAGE_BUTTONS.CARD_NUMBER }],
    [{ text: MANAGE_BUTTONS.ADD_BALANCE },   { text: MANAGE_BUTTONS.TRANSFER_USER }],
    [{ text: MANAGE_BUTTONS.BLOCKED_LIST }],
    [{ text: MANAGE_BUTTONS.BACK },          { text: USER_BUTTONS.MINIMIZE }],
  ],
  resize_keyboard: true,
  is_persistent: true,
});

export const channelCheckKeyboard = (
  channelUrl: string,
  botUsername: string
): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: "📢 عضویت در کانال", url: channelUrl }],
    [{ text: "✅ عضو شدم", url: `https://t.me/${botUsername}?start=checked` }],
  ],
});

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

export const unblockKeyboard = (userId: number): InlineKeyboardMarkup => ({
  inline_keyboard: [[{ text: "🔓 آزاد کردن", callback_data: `unblock:${userId}` }]],
});

export const removeKeyboard = () => ({ remove_keyboard: true as const });
