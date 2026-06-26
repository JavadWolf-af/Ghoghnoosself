import type {
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
} from "node-telegram-bot-api";

// ── Inline Navigation Keyboards ───────────────────────────────────────────────

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
    [{ text: "🔙 بازگشت به منو", callback_data: "nav:back" }],
  ],
});

export const adminMainKeyboard = (): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: "🛠 پنل مدیریت", callback_data: "nav:admin_manage" }],
  ],
});

// ── صفحه اصلی مدیریت — تمیز و دسته‌بندی‌شده ─────────────────────────────────
export const adminManageKeyboard = (): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: "📊 آمار سیستم",     callback_data: "nav:admin_stats" },       { text: "👥 مدیریت کاربران",  callback_data: "nav:admin_user_manage" }],
    [{ text: "🔑 مدیریت توکن",    callback_data: "nav:admin_token_manage" }, { text: "💳 شماره کارت",     callback_data: "nav:admin_set_card" }],
    [{ text: "💰 افزودن موجودی", callback_data: "nav:admin_add_balance" },  { text: "↔️ انتقال اعتبار", callback_data: "nav:admin_transfer" }],
    [{ text: "🎫 تیکت‌های باز",  callback_data: "nav:admin_open_tickets" }],
    [{ text: "🔙 بازگشت",         callback_data: "nav:back" }],
  ],
});

// ── زیرمنوی مدیریت توکن ──────────────────────────────────────────────────────
export const tokenManageKeyboard = (): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: "🔑 توکن جدید",    callback_data: "nav:admin_create_token" }],
    [{ text: "💵 هزینه توکن",   callback_data: "nav:admin_token_cost" },  { text: "⏳ توکن‌های گریس", callback_data: "nav:admin_grace_tokens" }],
    [{ text: "🔙 بازگشت",        callback_data: "nav:admin_manage" }],
  ],
});

// ── زیرمنوی مدیریت کاربران ───────────────────────────────────────────────────
export const userManageKeyboard = (): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: "📣 پیام همگانی",   callback_data: "nav:admin_broadcast" },   { text: "💬 پیام به کاربر",  callback_data: "nav:admin_message_user" }],
    [{ text: "🔍 جستجوی کاربر", callback_data: "nav:admin_search_user" },  { text: "🚫 لیست مسدودها",  callback_data: "nav:admin_blocked_list" }],
    [{ text: "🔙 بازگشت",        callback_data: "nav:admin_manage" }],
  ],
});

export const cancelKeyboard = (): InlineKeyboardMarkup => ({
  inline_keyboard: [[{ text: "🔙 لغو / بازگشت", callback_data: "nav:back" }]],
});

export const blockedKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [[{ text: "🎧 پشتیبانی" }]],
  resize_keyboard: true,
  is_persistent: true,
});

// ── Inline Keyboards (عملیات ادمین) ──────────────────────────────────────────

export const depositReviewKeyboard = (requestId: string, userId: number): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: "✅ تأیید واریز",   callback_data: `deposit:approve:${requestId}` },
      { text: "❌ رد درخواست",   callback_data: `deposit:reject:${requestId}` },
    ],
    [
      { text: "💬 پیام به کاربر", callback_data: `user:msg:${userId}` },
      { text: "⛔️ مسدود کردن",  callback_data: `user:block:${userId}` },
    ],
  ],
});

export const depositReviewWithRestoreKeyboard = (
  requestId: string, userId: number, tokenCode: string,
): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: "✅ تأیید واریز",   callback_data: `deposit:approve:${requestId}` },
      { text: "❌ رد درخواست",   callback_data: `deposit:reject:${requestId}` },
    ],
    [
      { text: "🔄 تأیید + بازگردانی توکن", callback_data: `deposit:approve_restore:${requestId}:${tokenCode}` },
    ],
    [
      { text: "💬 پیام به کاربر", callback_data: `user:msg:${userId}` },
      { text: "⛔️ مسدود کردن",  callback_data: `user:block:${userId}` },
    ],
  ],
});

export const ticketKeyboard = (ticketId: string): InlineKeyboardMarkup => ({
  inline_keyboard: [[
    { text: "✏️ پاسخ دادن", callback_data: `ticket:reply:${ticketId}` },
    { text: "🔒 بستن تیکت", callback_data: `ticket:close:${ticketId}` },
  ]],
});

export const unblockKeyboard = (userId: number): InlineKeyboardMarkup => ({
  inline_keyboard: [[{ text: "🔓 رفع مسدودیت", callback_data: `user:unblock:${userId}` }]],
});

export const adminUserActionKeyboard = (userId: number, isBlocked: boolean): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: "💰 افزودن موجودی", callback_data: `user:addbal:${userId}` },
      { text: "💬 پیام به کاربر", callback_data: `user:msg:${userId}` },
    ],
    [
      { text: "📊 داشبورد بیلینگ", callback_data: `user:billing:${userId}` },
    ],
    [
      {
        text: isBlocked ? "🔓 رفع مسدودیت" : "⛔️ مسدود کردن",
        callback_data: isBlocked ? `user:unblock:${userId}` : `user:block:${userId}`,
      },
    ],
    [{ text: "🔙 بازگشت به مدیریت کاربران", callback_data: "nav:admin_user_manage" }],
  ],
});

export const broadcastConfirmKeyboard = (): InlineKeyboardMarkup => ({
  inline_keyboard: [[
    { text: "✅ تأیید و ارسال", callback_data: "broadcast:confirm" },
    { text: "❌ لغو",            callback_data: "broadcast:cancel" },
  ]],
});

export const channelCheckKeyboard = (
  channelUrl: string,
  botUsername: string,
): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: "📢 عضویت در کانال", url: channelUrl }],
    [{ text: "✅ عضو شدم — بررسی کن", url: `https://t.me/${botUsername}?start=checked` }],
  ],
});

export const tokenCostKeyboard = (): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: "✏️ تنظیم هزینه روزانه", callback_data: "nav:admin_set_token_cost" }],
    [{ text: "⏳ مشاهده توکن‌های گریس",  callback_data: "nav:admin_grace_tokens" }],
    [{ text: "🔙 بازگشت",                callback_data: "nav:admin_token_manage" }],
  ],
});

export const graceTokenRestoreKeyboard = (tokenCode: string, userId: number): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: "🔄 بازگردانی توکن", callback_data: `token:restore:${tokenCode}:${userId}` }],
    [{ text: "🔙 بازگشت",          callback_data: "nav:admin_grace_tokens" }],
  ],
});

export const userBillingKeyboard = (userId: number): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: "🔙 بازگشت به پروفایل کاربر", callback_data: `user:profile:${userId}` }],
  ],
});

// ── Activated Services (after token activation) ───────────────────────────────

export const activatedServicesKeyboard = (hasApiCredentials: boolean): InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: hasApiCredentials ? "🔑 مشاهده API اکانت" : "📱 ورود به اکانت", callback_data: "nav:telegram_login" }],
    [{ text: "🔙 بازگشت به منو", callback_data: "nav:back" }],
  ],
});

export const sharePhoneKeyboard = (): ReplyKeyboardMarkup => ({
  keyboard: [[{ text: "📱 اشتراک‌گذاری شماره تلفن", request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
});
