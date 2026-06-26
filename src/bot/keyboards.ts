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

export const ADMIN_DEPOSIT_ACTIONS = {
  APPROVE: "✅ تأیید واریز",
  REJECT:  "❌ رد درخواست",
  MESSAGE: "💬 پیام به کاربر",
  BLOCK:   "⛔️ مسدود کردن",
};

export const ADMIN_TICKET_ACTIONS = {
  REPLY: "✏️ پاسخ دادن",
  CLOSE: "🔒 بستن تیکت",
};

export const ADMIN_USER_ACTIONS = {
  ADD_BALANCE: "💰 افزودن موجودی",
  MESSAGE:     "💬 پیام به کاربر",
  BLOCK:       "⛔️ مسدود کردن",
  UNBLOCK:     "🔓 رفع مسدودیت",
};

// ── Reply Keyboards (User) ────────────────────────────────────────────────────

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

// ── Reply Keyboards (Admin) ───────────────────────────────────────────────────

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

export const adminDepositReviewKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: ADMIN_DEPOSIT_ACTIONS.APPROVE }, { text: ADMIN_DEPOSIT_ACTIONS.REJECT }],
    [{ text: ADMIN_DEPOSIT_ACTIONS.MESSAGE }, { text: ADMIN_DEPOSIT_ACTIONS.BLOCK }],
    [{ text: BACK_BUTTON }],
  ],
  resize_keyboard: true,
});

export const adminTicketActionKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: ADMIN_TICKET_ACTIONS.REPLY }, { text: ADMIN_TICKET_ACTIONS.CLOSE }],
    [{ text: BACK_BUTTON }],
  ],
  resize_keyboard: true,
});

export const adminUserActionKeyboard = (isBlocked: boolean): ReplyKeyboardMarkup => ({
  keyboard: [
    [{ text: ADMIN_USER_ACTIONS.ADD_BALANCE }, { text: ADMIN_USER_ACTIONS.MESSAGE }],
    [{ text: isBlocked ? ADMIN_USER_ACTIONS.UNBLOCK : ADMIN_USER_ACTIONS.BLOCK }],
    [{ text: BACK_BUTTON }],
  ],
  resize_keyboard: true,
});

// ── Inline Keyboard (URL-only — cannot be a Reply Keyboard) ──────────────────

export const channelCheckKeyboard = (
  channelUrl: string,
  botUsername: string
): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: "📢 عضویت در کانال", url: channelUrl }],
    [{ text: "✅ عضو شدم — بررسی کن", url: `https://t.me/${botUsername}?start=checked` }],
  ],
});
