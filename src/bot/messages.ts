import type { UserRecord } from "./store";

/**
 * Escape special characters for Telegram's legacy Markdown parse mode.
 * Must be applied to ALL user-controlled strings before interpolation.
 * Special chars in legacy Markdown: _ * ` [
 */
export function esc(s: string | undefined): string {
  if (!s) return "";
  return s.replace(/[_*`[]/g, "\\$&");
}

// ── Welcome & Navigation ──────────────────────────────────────────────────────

export const WELCOME_MESSAGE = (firstName: string): string =>
  `✨ *${esc(firstName)}* عزیز، خوش آمدی!\n\n` +
  `به ربات سلف خوش آمدید 🎉\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `📢 برای استفاده از امکانات، ابتدا در کانال ما عضو شوید:`;

export const MAIN_MENU_MESSAGE = (firstName: string): string =>
  `👋 *${esc(firstName)}* خوش آمدی!\n\n` +
  `از منوی پایین یک گزینه انتخاب کن 👇`;

export const NOT_MEMBER_MESSAGE = (): string =>
  `⚠️ *هنوز عضو نشده‌ای!*\n\n` +
  `لطفاً ابتدا در کانال عضو شو،\n` +
  `سپس دکمه «✅ عضو شدم» را بزن.`;

export const MEMBERSHIP_CHECK_FAILED_MESSAGE = (): string =>
  `⚠️ *خطا در بررسی عضویت*\n\n` +
  `در حال حاضر امکان بررسی وجود ندارد.\n` +
  `چند دقیقه صبر کن و دوباره /start بزن.`;

// ── Admin Panels ──────────────────────────────────────────────────────────────

export const ADMIN_PANEL_MESSAGE = (): string =>
  `🔐 *پنل ادمین*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `به پنل مدیریت خوش آمدید.\n` +
  `از دکمه‌های زیر استفاده کنید:`;

export const ADMIN_MANAGE_MESSAGE = (): string =>
  `🛠 *مدیریت سیستم*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `یک گزینه را انتخاب کنید:`;

// ── Support / Ticket ──────────────────────────────────────────────────────────

export const SUPPORT_PROMPT = (): string =>
  `🎧 *پشتیبانی*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `پیام خود را بنویسید.\n` +
  `یک تیکت ثبت می‌شود و در اسرع وقت پاسخ می‌گیرید 🙏\n\n` +
  `↩️ برای انصراف 🔙 را بزنید`;

export const TICKET_CREATED_USER = (ticketId: string): string =>
  `✅ *تیکت شما ثبت شد*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `🎫 شماره تیکت: \`${ticketId}\`\n\n` +
  `پیام شما دریافت شد.\nپشتیبانی به‌زودی پاسخ می‌دهد 🙏`;

export const TICKET_REPLY_USER = (ticketId: string, replyText: string): string =>
  `💬 *پاسخ پشتیبانی*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `🎫 تیکت: \`${ticketId}\`\n\n` +
  `${esc(replyText)}`;

export const TICKET_CLOSED_USER = (ticketId: string): string =>
  `🔒 *تیکت بسته شد*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `🎫 شماره: \`${ticketId}\`\n\n` +
  `تیکت شما توسط پشتیبانی بسته شد.\n` +
  `اگر مشکل حل نشده، دوباره تماس بگیرید.`;

export const TICKET_ADDED_USER = (ticketId: string): string =>
  `📨 *پیام شما اضافه شد*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `🎫 تیکت: \`${ticketId}\`\n\n` +
  `پیام به تیکت موجود اضافه شد.\nمنتظر پاسخ باشید 🙏`;

export const ADMIN_NEW_TICKET = (
  ticketId: string, userId: number, firstName: string,
  username: string | undefined, text: string
): string =>
  `🎫 *تیکت جدید*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `🆔 شماره: \`${ticketId}\`\n` +
  `👤 کاربر: *${esc(firstName)}*${username ? ` (@${esc(username)})` : ""}\n` +
  `🔢 آیدی: \`${userId}\`\n\n` +
  `💬 *پیام:*\n${esc(text)}`;

export const ADMIN_TICKET_FOLLOWUP = (
  ticketId: string, userId: number, firstName: string,
  username: string | undefined, text: string
): string =>
  `📩 *پیام جدید در تیکت*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `🆔 شماره: \`${ticketId}\`\n` +
  `👤 کاربر: *${esc(firstName)}*${username ? ` (@${esc(username)})` : ""}\n` +
  `🔢 آیدی: \`${userId}\`\n\n` +
  `💬 *پیام:*\n${esc(text)}`;

export const ADMIN_TICKET_REPLY_PROMPT = (ticketId: string): string =>
  `✏️ *پاسخ به تیکت*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `🎫 شماره: \`${ticketId}\`\n\n` +
  `پیام پاسخ خود را بنویسید:\n\n` +
  `↩️ برای انصراف 🔙 را بزنید`;

export const ADMIN_TICKET_REPLY_SENT = (ticketId: string): string =>
  `✅ پاسخ به تیکت \`${ticketId}\` ارسال شد.`;

export const ADMIN_TICKET_CLOSED = (ticketId: string): string =>
  `🔒 تیکت \`${ticketId}\` با موفقیت بسته شد.`;

export const ADMIN_TICKET_ALREADY_CLOSED = (ticketId: string): string =>
  `⚠️ تیکت \`${ticketId}\` قبلاً بسته شده است.`;

// ── Blocked user support ──────────────────────────────────────────────────────

export const BLOCKED_SUPPORT_PROMPT = (): string =>
  `🎧 *پشتیبانی*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `⛔️ حساب شما مسدود شده است.\n\n` +
  `پیام خود را بنویسید تا به پشتیبانی ارسال شود:\n\n` +
  `↩️ برای انصراف 🔙 را بزنید`;

export const BLOCKED_SUPPORT_SENT = (): string =>
  `📨 *پیام ارسال شد*\n\n` +
  `پیام شما به پشتیبانی رسید.\nمنتظر پاسخ باشید 🙏`;

export const BLOCKED_ONLY_SUPPORT = (): string =>
  `⛔️ *دسترسی محدود*\n\n` +
  `حساب شما مسدود است.\n` +
  `فقط می‌توانید با پشتیبانی تماس بگیرید.`;

// ── Token ─────────────────────────────────────────────────────────────────────

export const TOKEN_SECTION_MESSAGE = (): string =>
  `🔑 *فعال‌سازی توکن*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `این بخش برای فعال‌سازی امکانات ویژه است.\n\n` +
  `توکن خود را وارد کنید:\n\n` +
  `↩️ برای انصراف 🔙 را بزنید`;

export const TOKEN_ALREADY_ACTIVATED_MESSAGE = (): string =>
  `✅ *حساب شما فعال است*\n\n` +
  `قبلاً توکن خود را فعال کرده‌اید.\nبه تمام امکانات دسترسی دارید 🎉`;

export const TOKEN_SUCCESS_MESSAGE = (firstName: string): string =>
  `🎉 *تبریک ${esc(firstName)} عزیز!*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `توکن شما با موفقیت فعال شد! 🚀\nاکنون به امکانات ویژه دسترسی دارید.`;

export const TOKEN_INVALID_MESSAGE = (): string =>
  `❌ *توکن نامعتبر*\n\nکد وارد شده اشتباه است.\nبررسی کنید و دوباره امتحان کنید.`;

export const TOKEN_ALREADY_USED_MESSAGE = (): string =>
  `⚠️ *توکن استفاده شده*\n\nاین توکن قبلاً استفاده شده است.\nبرای دریافت توکن جدید با پشتیبانی تماس بگیرید.`;

export const TOKEN_CREATED_MESSAGE = (code: string): string =>
  `🔑 *توکن جدید ساخته شد*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `\`${code}\`\n\n` +
  `⚠️ هر توکن فقط یک بار قابل استفاده است.`;

// ── Wallet ────────────────────────────────────────────────────────────────────

export const WALLET_MESSAGE = (balance: number): string =>
  `💎 *کیف پول*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `موجودی فعلی:\n` +
  `*${balance.toLocaleString("fa-IR")} تومان*\n\n` +
  `یک گزینه را انتخاب کنید 👇`;

export const ADD_BALANCE_AMOUNT_PROMPT = (): string =>
  `💳 *افزایش موجودی*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `مبلغ واریز را *به تومان* وارد کنید:\n\n` +
  `↩️ برای انصراف 🔙 را بزنید`;

export const ADD_BALANCE_RECEIPT = (receiptId: string, amount: number, cardNumber: string): string =>
  `🧾 *اطلاعات واریز*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `🆔 شناسه رسید: \`${receiptId}\`\n` +
  `💵 مبلغ: *${amount.toLocaleString("fa-IR")} تومان*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `💳 شماره کارت برای واریز:\n` +
  `\`${cardNumber || "هنوز توسط ادمین تنظیم نشده"}\`\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `✅ پس از واریز، تصویر رسید بانکی را ارسال کنید.\n` +
  `📝 شناسه رسید را یادداشت کنید.\n\n` +
  `↩️ برای انصراف 🔙 را بزنید`;

export const BALANCE_REQUEST_SENT = (): string =>
  `✅ *رسید دریافت شد*\n\n` +
  `درخواست شما ارسال شد.\nپس از تأیید ادمین، موجودی به‌روز می‌شود.`;

export const BALANCE_APPROVED_USER = (amount: number, newBalance: number): string =>
  `✅ *موجودی افزایش یافت*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `💵 مبلغ واریزی: *${amount.toLocaleString("fa-IR")} تومان*\n` +
  `💎 موجودی جدید: *${newBalance.toLocaleString("fa-IR")} تومان*\n\n` +
  `از اعتماد شما متشکریم 🙏`;

export const BALANCE_REJECTED_USER = (): string =>
  `❌ *درخواست رد شد*\n\n` +
  `رسید ارسالی تأیید نشد.\nدر صورت مشکل با پشتیبانی تماس بگیرید 🎧`;

// ── Block / Unblock ───────────────────────────────────────────────────────────

export const BLOCKED_MESSAGE = (): string =>
  `⛔️ *حساب شما مسدود شد*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `به دلیل نقض قوانین، حساب شما مسدود شده است.\n\n` +
  `تنها دسترسی به پشتیبانی امکان‌پذیر است.`;

export const UNBLOCKED_MESSAGE = (): string =>
  `✅ *حساب شما آزاد شد*\n\n` +
  `محدودیت برداشته شده است.\nمی‌توانید مجدداً از تمام خدمات استفاده کنید 🎉`;

// ── Transfer ──────────────────────────────────────────────────────────────────

export const TRANSFER_PROMPT = (): string =>
  `↗️ *انتقال اعتبار*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `شناسه کاربر مقصد و مبلغ را وارد کنید:\n\n` +
  `\`[شناسه کاربر] [مبلغ]\`\n\n` +
  `مثال: \`123456789 50000\`\n\n` +
  `↩️ برای انصراف 🔙 را بزنید`;

export const TRANSFER_SUCCESS = (toUserId: number, amount: number): string =>
  `✅ *انتقال موفق*\n\n` +
  `*${amount.toLocaleString("fa-IR")} تومان* به کاربر \`${toUserId}\` منتقل شد.`;

export const TRANSFER_FAILED = (reason: string): string => ({
  insufficient_balance: "❌ *موجودی کافی نیست*\n\nموجودی شما برای این انتقال کافی نیست.",
  target_not_found:     "❌ *کاربر یافت نشد*\n\nکاربر مقصد در ربات ثبت‌نام نکرده است.",
  invalid_format:       "❌ *فرمت نادرست*\n\nشناسه کاربر و مبلغ را جداگانه وارد کنید.\nمثال: `123456789 50000`",
  invalid_amount:       "❌ *مبلغ نامعتبر*\n\nمبلغ باید یک عدد مثبت باشد.",
}[reason] ?? "❌ *خطا در انتقال*\n\nدوباره امتحان کنید.");

// ── Profile / Referral ────────────────────────────────────────────────────────

export const REFERRAL_MESSAGE = (user: UserRecord, botUsername: string): string =>
  `🔗 *دعوت از دوستان*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `لینک اختصاصی شما:\n` +
  `\`https://t.me/${botUsername}?start=${user.referralCode}\`\n\n` +
  `👥 دعوت‌شده‌ها: *${user.referralCount}* نفر\n\n` +
  `این لینک را با دوستانت به اشتراک بگذار 🎁`;

export const PROFILE_MESSAGE = (user: UserRecord): string =>
  `👤 *پروفایل*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `🆔 شناسه: \`${user.id}\`\n` +
  `📛 نام: *${esc(user.firstName)}${user.lastName ? " " + esc(user.lastName) : ""}*\n` +
  (user.username ? `🔖 یوزرنیم: @${esc(user.username)}\n` : "") +
  `📅 عضویت: ${user.joinedAt.toLocaleDateString("fa-IR")}\n` +
  `💎 موجودی: *${user.balance.toLocaleString("fa-IR")} تومان*\n` +
  `👥 زیرمجموعه: *${user.referralCount}* نفر`;

// ── Admin Manage ──────────────────────────────────────────────────────────────

export const STATS_MESSAGE = (users: number, tokens: number, unused: number, openTickets: number): string =>
  `📊 *آمار سیستم*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `👥 کاربران: *${users}* نفر\n` +
  `🔑 توکن صادر شده: *${tokens}*\n` +
  `✅ توکن باقی‌مانده: *${unused}*\n` +
  `🎫 تیکت‌های باز: *${openTickets}*`;

export const BROADCAST_PROMPT = (): string =>
  `📣 *پیام همگانی*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `متن پیام همگانی را بنویسید:\n\n` +
  `↩️ برای انصراف 🔙 را بزنید`;

export const BROADCAST_SENT = (count: number): string =>
  `✅ پیام برای *${count}* کاربر ارسال شد.`;

export const CARD_NUMBER_PROMPT = (): string =>
  `💳 *تنظیم شماره کارت*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `شماره کارت جدید را وارد کنید:\n\n` +
  `↩️ برای انصراف 🔙 را بزنید`;

export const CARD_NUMBER_SET = (card: string): string =>
  `✅ شماره کارت ذخیره شد:\n\`${card}\``;

export const BLOCKED_LIST_MESSAGE = (
  blockedUsers: Array<{ id: number; firstName: string; username?: string }>
): string => {
  if (blockedUsers.length === 0) return `✅ هیچ کاربر مسدودی وجود ندارد.`;
  const lines = blockedUsers.map((u, i) =>
    `${i + 1}. *${esc(u.firstName)}*${u.username ? ` (@${esc(u.username)})` : ""} — \`${u.id}\``
  );
  return (
    `🚫 *لیست مسدودها* (${blockedUsers.length} نفر)\n\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `${lines.join("\n")}\n\n` +
    `برای رفع مسدودیت روی دکمه زیر هر کاربر کلیک کنید:`
  );
};

export const ADMIN_DEPOSIT_REVIEW = (
  requestId: string, amount: number, userId: number, firstName: string, username?: string
): string =>
  `📥 *درخواست افزایش موجودی*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `🆔 شناسه: \`${requestId}\`\n` +
  `👤 کاربر: *${esc(firstName)}*${username ? ` (@${esc(username)})` : ""}\n` +
  `🔢 آیدی: \`${userId}\`\n` +
  `💵 مبلغ: *${amount.toLocaleString("fa-IR")} تومان*\n\n` +
  `رسید واریز را بالا مشاهده کنید 👆`;

export const ADMIN_SUPPORT_FROM_BLOCKED = (
  userId: number, firstName: string, username: string | undefined, text: string
): string =>
  `🎧 *پشتیبانی — کاربر مسدود*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `👤 کاربر: *${esc(firstName)}*${username ? ` (@${esc(username)})` : ""}\n` +
  `🔢 آیدی: \`${userId}\`\n\n` +
  `💬 *پیام:*\n${esc(text)}`;

export const ADMIN_ADD_BALANCE_PROMPT = (): string =>
  `💰 *افزودن موجودی*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `آیدی عددی کاربر را وارد کنید:\n\n` +
  `↩️ برای انصراف 🔙 را بزنید`;

export const ADMIN_ADD_BALANCE_AMOUNT_PROMPT = (firstName: string): string =>
  `👤 کاربر: *${esc(firstName)}*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `مقدار افزایش موجودی را *به تومان* وارد کنید:\n\n` +
  `↩️ برای انصراف 🔙 را بزنید`;

export const ADMIN_BALANCE_ADDED = (firstName: string, userId: number, amount: number): string =>
  `✅ *موجودی افزایش یافت*\n\n` +
  `👤 کاربر: *${esc(firstName)}* (\`${userId}\`)\n` +
  `💵 مبلغ: *${amount.toLocaleString("fa-IR")} تومان*`;

export const ADMIN_USER_NOT_FOUND = (): string =>
  `❌ *کاربر یافت نشد*\n\nکاربری با این آیدی ثبت‌نام نکرده است.`;

export const ADMIN_INVALID_ID = (): string =>
  `❌ *آیدی نامعتبر*\n\nلطفاً یک عدد صحیح وارد کنید.`;

export const ADMIN_MSG_PROMPT = (): string =>
  `💬 *پیام به کاربر*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `متن پیام را بنویسید:\n\n` +
  `↩️ برای انصراف 🔙 را بزنید`;

export const ADMIN_MSG_SENT = (): string =>
  `✅ پیام با موفقیت ارسال شد.`;

export const ADMIN_DEPOSIT_APPROVED = (requestId: string): string =>
  `✅ درخواست \`${requestId}\` تأیید و موجودی اضافه شد.`;

export const ADMIN_DEPOSIT_REJECTED = (requestId: string): string =>
  `❌ درخواست \`${requestId}\` رد شد.`;

export const ADMIN_USER_BLOCKED = (firstName: string, userId: number): string =>
  `⛔️ کاربر *${esc(firstName)}* (\`${userId}\`) مسدود شد.`;

export const ADMIN_USER_UNBLOCKED = (firstName: string, userId: number): string =>
  `✅ کاربر *${esc(firstName)}* (\`${userId}\`) آزاد شد.`;

export const ADMIN_TRANSFER_PROMPT = (): string =>
  `↔️ *انتقال اعتبار کاربر*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `فرمت: \`[شناسه مبدأ] [شناسه مقصد] [مبلغ]\`\n\n` +
  `مثال: \`111 222 50000\`\n\n` +
  `↩️ برای انصراف 🔙 را بزنید`;

export const ADMIN_TRANSFER_SUCCESS = (from: number, to: number, amount: number): string =>
  `✅ *انتقال موفق*\n\n` +
  `*${amount.toLocaleString("fa-IR")} تومان* از \`${from}\` به \`${to}\` منتقل شد.`;

// ── Ticket Reminder ───────────────────────────────────────────────────────────

export const ADMIN_TICKET_REMINDER = (
  ticketId: string,
  userId: number,
  firstName: string,
  username: string | undefined,
  lastMessageText: string,
  waitHours: number,
): string =>
  `⏰ *یادآوری — تیکت بی‌پاسخ*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `🎫 تیکت: \`${ticketId}\`\n` +
  `👤 کاربر: *${esc(firstName)}*${username ? ` (@${esc(username)})` : ""}\n` +
  `🔢 آیدی: \`${userId}\`\n` +
  `🕐 بیش از *${waitHours} ساعت* بدون پاسخ\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `💬 *آخرین پیام:*\n_${esc(lastMessageText).slice(0, 200)}${lastMessageText.length > 200 ? "…" : ""}_`;
