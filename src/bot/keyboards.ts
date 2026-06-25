import type {
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
} from "node-telegram-bot-api";

export const USER_BUTTONS = {
  ADD_TOKEN: "➕ افزودن توکن سلف",
  SUPPORT: "📞 پشتیبانی",
};

export const ACTIVATED_USER_BUTTONS = {
  FEATURES: "🌟 امکانات",
  BALANCE: "💰 افزایش موجودی",
  SUPPORT: "📞 پشتیبانی",
};

export const ADMIN_BUTTONS = {
  STATS: "📊 آمار کاربران",
  BROADCAST: "📢 ارسال پیام همگانی",
  MENU_MANAGE: "📋 مدیریت منو",
  ADD_BALANCE: "💰 افزایش موجودی",
  EXIT_ADMIN: "🚪 خروج از پنل ادمین",
};

export const MENU_MANAGE_BUTTONS = {
  ADD_TOKEN: "➕ افزودن توکن",
  BACK: "🔙 بازگشت",
};

export const userMenuKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: USER_BUTTONS.ADD_TOKEN }],
    [{ text: USER_BUTTONS.SUPPORT }],
  ],
  resize_keyboard: true,
  is_persistent: true,
});

export const activatedUserKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: ACTIVATED_USER_BUTTONS.FEATURES }],
    [{ text: ACTIVATED_USER_BUTTONS.BALANCE }],
    [{ text: ACTIVATED_USER_BUTTONS.SUPPORT }],
  ],
  resize_keyboard: true,
  is_persistent: true,
});

export const blockedUserKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: USER_BUTTONS.SUPPORT }],
  ],
  resize_keyboard: true,
  is_persistent: true,
});

export const adminMenuKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: ADMIN_BUTTONS.STATS }, { text: ADMIN_BUTTONS.BROADCAST }],
    [{ text: ADMIN_BUTTONS.ADD_BALANCE }, { text: ADMIN_BUTTONS.MENU_MANAGE }],
    [{ text: ADMIN_BUTTONS.EXIT_ADMIN }],
  ],
  resize_keyboard: true,
  is_persistent: true,
});

export const menuManageKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: MENU_MANAGE_BUTTONS.ADD_TOKEN }],
    [{ text: MENU_MANAGE_BUTTONS.BACK }],
  ],
  resize_keyboard: true,
  is_persistent: true,
});

export const removeKeyboard = () => ({
  remove_keyboard: true as const,
});

export const channelCheckKeyboard = (
  channelUrl: string,
  botUsername: string
): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: "📢 عضویت در کانال", url: channelUrl }],
    [
      {
        text: "✅ عضو شدم",
        url: `https://t.me/${botUsername}?start=checked`,
      },
    ],
  ],
});

export const depositReviewKeyboard = (depositId: string): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: "✅ تایید و افزایش موجودی", callback_data: `dep_approve:${depositId}` },
      { text: "❌ رد درخواست", callback_data: `dep_reject:${depositId}` },
    ],
    [
      { text: "📨 پیام به کاربر", callback_data: `dep_msg:${depositId}` },
      { text: "🚫 بلاک کاربر", callback_data: `dep_block:${depositId}` },
    ],
  ],
});

export const unblockKeyboard = (userId: number): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: "🔓 آزاد کردن کاربر", callback_data: `unblock:${userId}` }],
  ],
});
