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

export const ADD_BALANCE_RECEIPT = (
  receiptId: string,
  amount: number,
  cardNumber: string,
  cardHolder: string,
  cardBank: string,
): string =>
  `🧾 *اطلاعات واریز*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `🆔 شناسه رسید: \`${receiptId}\`\n` +
  `💵 مبلغ: *${amount.toLocaleString("fa-IR")} تومان*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `💳 شماره کارت:\n\`${cardNumber || "هنوز تنظیم نشده"}\`\n` +
  (cardHolder ? `👤 صاحب حساب: *${cardHolder}*\n` : "") +
  (cardBank   ? `🏦 بانک: *${cardBank}*\n`         : "") +
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
  `💳 *تنظیم اطلاعات کارت — مرحله ۱/۳*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `شماره کارت جدید را وارد کنید:\n\n` +
  `↩️ برای انصراف 🔙 را بزنید`;

export const CARD_HOLDER_PROMPT = (card: string): string =>
  `💳 *تنظیم اطلاعات کارت — مرحله ۲/۳*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `شماره کارت: \`${card}\`\n\n` +
  `نام و نام‌خانوادگی صاحب حساب را وارد کنید:\n\n` +
  `↩️ برای انصراف 🔙 را بزنید`;

export const CARD_BANK_PROMPT = (card: string, holder: string): string =>
  `💳 *تنظیم اطلاعات کارت — مرحله ۳/۳*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `شماره کارت: \`${card}\`\n` +
  `صاحب حساب: *${holder}*\n\n` +
  `نام بانک را وارد کنید (مثال: ملت، صادرات، تجارت):\n\n` +
  `↩️ برای انصراف 🔙 را بزنید`;

export const CARD_INFO_SET = (card: string, holder: string, bank: string): string =>
  `✅ *اطلاعات کارت ذخیره شد*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `💳 شماره کارت: \`${card}\`\n` +
  `👤 صاحب حساب: *${holder}*\n` +
  `🏦 بانک: *${bank}*`;

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

// ── Admin Search User ─────────────────────────────────────────────────────────

export const ADMIN_SEARCH_USER_PROMPT = (): string =>
  `🔍 *جستجوی کاربر*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `آیدی عددی یا یوزرنیم کاربر را وارد کنید:\n\n` +
  `مثال: \`123456789\` یا \`@username\`\n\n` +
  `↩️ برای انصراف 🔙 را بزنید`;

export const ADMIN_SEARCH_USER_NOT_FOUND = (): string =>
  `❌ *کاربر یافت نشد*\n\nکاربری با این آیدی یا یوزرنیم ثبت‌نام نکرده است.`;

export const ADMIN_USER_PROFILE_ADMIN = (user: {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  joinedAt: Date;
  isActivated: boolean;
  isBlocked: boolean;
  balance: number;
  referralCount: number;
}): string =>
  `👤 *پروفایل کاربر*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `🆔 آیدی: \`${user.id}\`\n` +
  `📛 نام: *${esc(user.firstName)}${user.lastName ? " " + esc(user.lastName) : ""}*\n` +
  (user.username ? `🔖 یوزرنیم: @${esc(user.username)}\n` : "") +
  `📅 عضویت: ${user.joinedAt.toLocaleDateString("fa-IR")}\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `💎 موجودی: *${user.balance.toLocaleString("fa-IR")} تومان*\n` +
  `👥 زیرمجموعه: *${user.referralCount}* نفر\n` +
  `🔑 وضعیت: ${user.isActivated ? "✅ فعال" : "⏳ غیرفعال"}\n` +
  `🔒 مسدود: ${user.isBlocked ? "⛔️ بله" : "✅ خیر"}`;

// ── Open Tickets View ─────────────────────────────────────────────────────────

export const USER_NO_OPEN_TICKET = (): string =>
  `✅ *تیکت باز ندارید*\n\n` +
  `در حال حاضر هیچ تیکت فعالی ندارید.\n` +
  `برای تماس با پشتیبانی از دکمه 🎧 استفاده کنید.`;

export const USER_OPEN_TICKET = (
  ticketId: string,
  createdAt: Date,
  messages: Array<{ from: "user" | "admin"; text: string; at: Date }>
): string => {
  const SHOW_LAST = 5;
  const shown  = messages.slice(-SHOW_LAST);
  const omitted = messages.length - shown.length;

  const msgLines = shown.map(m => {
    const who = m.from === "user" ? "👤 *شما*" : "🔧 *پشتیبانی*";
    return `${who}:\n${esc(m.text)}`;
  }).join("\n\n");

  const prefix = omitted > 0
    ? `_... ${omitted} پیام قدیمی‌تر ..._\n\n━━━━━━━━━━━━━━━━━\n\n`
    : "";

  return (
    `🎫 *تیکت باز شما*\n\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `🆔 شماره: \`${ticketId}\`\n` +
    `📅 تاریخ: ${createdAt.toLocaleDateString("fa-IR")}\n` +
    `💬 تعداد پیام: *${messages.length}*\n\n` +
    `━━━━━━━━━━━━━━━━━\n\n` +
    prefix + msgLines +
    `\n\n━━━━━━━━━━━━━━━━━\n` +
    `برای ارسال پیام جدید از 🎧 *پشتیبانی* استفاده کنید.`
  );
};

export const ADMIN_OPEN_TICKETS_HEADER = (count: number): string =>
  count === 0
    ? `✅ *هیچ تیکت بازی وجود ندارد*\n\nالان همه چیز آروم‌ه 🙂`
    : `🎫 *تیکت‌های باز* — ${count} عدد\n\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `به ترتیب قدیمی‌ترین نمایش داده می‌شوند:\n` +
      `🔴 = آخرین پیام از کاربر (نیاز به پاسخ)`;

export const ADMIN_OPEN_TICKET_ITEM = (
  ticketId: string,
  userId: number,
  firstName: string,
  username: string | undefined,
  createdAt: Date,
  messageCount: number,
  lastFrom: "user" | "admin",
  lastText: string,
): string => {
  const indicator = lastFrom === "user" ? " 🔴" : " 🟢";
  const lastBy    = lastFrom === "user" ? "👤 کاربر" : "🔧 ادمین";
  const preview   = esc(lastText).slice(0, 100) + (lastText.length > 100 ? "…" : "");
  return (
    `🎫 \`${ticketId}\`${indicator}\n` +
    `👤 *${esc(firstName)}*${username ? ` (@${esc(username)})` : ""} — \`${userId}\`\n` +
    `📅 ${createdAt.toLocaleDateString("fa-IR")} · ${messageCount} پیام\n\n` +
    `${lastBy}: _${preview}_`
  );
};

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

// ── Token Billing ─────────────────────────────────────────────────────────────

export const ADMIN_TOKEN_COST_MESSAGE = (
  hourly: number, activeCount: number, graceCount: number,
): string =>
  `🔑 *هزینه توکن*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `⏰ هزینه ساعتی: *${hourly > 0 ? hourly.toLocaleString("fa-IR") + " تومان" : "تنظیم نشده"}*\n` +
  `☀️ معادل روزانه: *${hourly > 0 ? (hourly * 24).toLocaleString("fa-IR") + " تومان" : "—"}*\n` +
  `📅 معادل ماهانه: *${hourly > 0 ? (hourly * 24 * 30).toLocaleString("fa-IR") + " تومان" : "—"}*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `✅ توکن‌های فعال: *${activeCount}*\n` +
  `⏳ در دوره گریس: *${graceCount}*`;

export const TOKEN_COST_PROMPT = (): string =>
  `✏️ *تنظیم هزینه ساعتی توکن*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `هزینه هر ساعت به *تومان* را وارد کنید:\n\n` +
  `مثال: \`42\` (ساعتی ۴۲ تومان = روزی ۱۰۰۸ تومان)\n\n` +
  `برای غیرفعال کردن صورتحساب، عدد \`0\` وارد کنید.\n\n` +
  `↩️ برای انصراف 🔙 را بزنید`;

export const TOKEN_COST_SET = (hourly: number): string =>
  hourly === 0
    ? `✅ *صورتحساب غیرفعال شد*\n\nدیگر هزینه‌ای از کاربران کم نمی‌شود.`
    : `✅ *هزینه ساعتی توکن تنظیم شد*\n\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `⏰ ساعتی: *${hourly.toLocaleString("fa-IR")} تومان*\n` +
      `☀️ روزانه: *${(hourly * 24).toLocaleString("fa-IR")} تومان*\n` +
      `📅 ماهانه: *${(hourly * 24 * 30).toLocaleString("fa-IR")} تومان*\n\n` +
      `از ساعت بعد اعمال می‌شود.`;

export const BALANCE_LOW_WARNING = (daysLeft: number): string =>
  `⚠️ *اعلان کیف پول — موجودی کم*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `موجودی کیف پول شما به حدود *${daysLeft} روز* اشتراک رسیده است.\n\n` +
  `لطفاً هر چه زودتر کیف پول خود را شارژ کنید تا سرویس شما قطع نشود 🙏\n\n` +
  `از منوی اصلی → 💎 کیف پول → افزایش موجودی اقدام کنید.`;

export const BALANCE_CRITICAL_WARNING = (daysLeft: number): string =>
  `🚨 *هشدار مهم — موجودی بحرانی*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `موجودی شما تنها برای *${daysLeft} روز* دیگر کافی است!\n\n` +
  `اگر کیف پول شارژ نشود، سرویس شما به حالت تعلیق می‌رود.\n\n` +
  `همین الان اقدام کنید 👇\n` +
  `💎 کیف پول → افزایش موجودی`;

export const TOKEN_GRACE_STARTED = (graceDays: number): string =>
  `🔴 *توکن شما به تعلیق رفت*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `موجودی کیف پول شما صفر شده و سرویس شما متوقف شده است.\n\n` +
  `⏰ شما *${graceDays} روز* فرصت دارید کیف پول را شارژ کنید.\n` +
  `در این صورت تنظیمات و سرویس شما *حفظ می‌شود*.\n\n` +
  `در صورت عدم شارژ ظرف ${graceDays} روز، توکن شما *حذف* و تنظیمات *ریست* می‌شود.\n\n` +
  `همین الان اقدام کنید 👇\n` +
  `💎 کیف پول → افزایش موجودی`;

export const TOKEN_GRACE_REMINDER = (daysLeft: number): string =>
  `⏰ *یادآوری — توکن در حال انقضا*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `توکن شما در *${daysLeft} روز دیگر* حذف خواهد شد.\n\n` +
  `در صورت شارژ کیف پول و تأیید ادمین، تنظیمات شما حفظ خواهد ماند.\n\n` +
  `💎 کیف پول → افزایش موجودی`;

export const TOKEN_EXPIRED_NOTIFY = (): string =>
  `❌ *توکن شما منقضی شد*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `به دلیل عدم شارژ کیف پول در مدت مقرر، توکن شما حذف و تنظیمات ریست شد.\n\n` +
  `برای استفاده مجدد با پشتیبانی تماس بگیرید یا توکن جدید دریافت کنید.`;

export const ADMIN_GRACE_TOKENS_HEADER = (count: number): string =>
  count === 0
    ? `✅ *هیچ توکنی در دوره گریس نیست*`
    : `⏳ *توکن‌های در دوره گریس* — ${count} عدد\n\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `اگر کاربر کیف پول را شارژ کرد، از دکمه بازگردانی استفاده کنید:`;

export const ADMIN_GRACE_TOKEN_ITEM = (
  tokenCode: string, userId: number, firstName: string,
  username: string | undefined, graceStartedAt: Date, daysLeft: number,
): string =>
  `⏳ توکن: \`${tokenCode}\`\n` +
  `👤 *${firstName}*${username ? ` (@${username})` : ""} — \`${userId}\`\n` +
  `📅 شروع گریس: ${graceStartedAt.toLocaleDateString("fa-IR")}\n` +
  `⏰ باقی‌مانده: *${daysLeft} روز*`;

export const ADMIN_TOKEN_RESTORED = (firstName: string, userId: number): string =>
  `🔄 *توکن بازگردانده شد*\n\n` +
  `👤 کاربر: *${firstName}* (\`${userId}\`)\n` +
  `✅ توکن فعال شد و تنظیمات حفظ گردید.`;

export const ADMIN_BILLING_REPORT = (
  billed: number, graceStarted: number, expired: number,
): string =>
  `📊 *گزارش صورتحساب ساعتی*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `✅ کسر موفق: *${billed}* توکن\n` +
  `⏳ وارد گریس شده: *${graceStarted}* توکن\n` +
  `❌ منقضی شده: *${expired}* توکن`;

// ── Admin User Billing Dashboard ─────────────────────────────────────────────

export const ADMIN_USER_BILLING_DASHBOARD = (
  user: { id: number; firstName: string; username?: string; balance: number },
  hourlyCost: number,
  tokenStatus: "active" | "grace" | "expired" | "none",
  tokenCode: string | undefined,
  tokenUsedAt: Date | undefined,
  graceStartedAt: Date | undefined,
  apiCredentials?: { phoneNumber?: string | null; tgApiId?: number | null; tgApiHash?: string | null },
): string => {
  const bal = user.balance;
  const name = user.firstName + (user.username ? ` (@${user.username})` : "");

  const hoursLeft  = hourlyCost > 0 ? Math.floor(bal / hourlyCost) : Infinity;
  const daysLeft   = hourlyCost > 0 ? Math.floor(bal / (hourlyCost * 24)) : Infinity;
  const hoursStr   = hourlyCost === 0
    ? "—"
    : hoursLeft === Infinity
      ? "∞"
      : `${hoursLeft} ساعت (${daysLeft} روز)`;

  const statusEmoji: Record<string, string> = {
    active: "✅", grace: "⏳", expired: "❌", none: "➖",
  };
  const statusLabel: Record<string, string> = {
    active: "فعال", grace: "در دوره گریس", expired: "منقضی", none: "بدون توکن",
  };

  let graceInfo = "";
  if (tokenStatus === "grace" && graceStartedAt) {
    const graceAge  = Date.now() - graceStartedAt.getTime();
    const daysInGrace = Math.floor(graceAge / (24 * 60 * 60 * 1000));
    const daysRemaining = Math.max(0, 10 - daysInGrace);
    graceInfo = `\n⏰ وارد گریس: ${graceStartedAt.toLocaleDateString("fa-IR")}\n` +
                `🔴 روزهای باقی‌مانده در گریس: *${daysRemaining} روز*`;
  }

  let usageDuration = "";
  if (tokenUsedAt) {
    const ms   = Date.now() - tokenUsedAt.getTime();
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    usageDuration = `\n📆 مدت استفاده از توکن: *${days} روز و ${hours} ساعت*`;
    if (hourlyCost > 0) {
      const totalDeducted = Math.floor(ms / (60 * 60 * 1000)) * hourlyCost;
      usageDuration += `\n💸 برآورد کسر شده: *${totalDeducted.toLocaleString("fa-IR")} تومان*`;
    }
  }

  const apiBlock = apiCredentials?.tgApiId
    ? "\n\n━━━━━━━━━━━━━━━━━\n" +
      "📱 شماره تلفن: " + (apiCredentials.phoneNumber ? "`" + apiCredentials.phoneNumber + "`" : "—") + "\n" +
      "🔑 API ID: `" + apiCredentials.tgApiId + "`\n" +
      "🔐 API Hash: `" + (apiCredentials.tgApiHash ?? "—") + "`"
    : "";
  return `📊 *داشبورد بیلینگ کاربر*\n\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `👤 *${name}*\n` +
    `🆔 شناسه: \`${user.id}\`\n\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `💎 موجودی کیف پول: *${bal.toLocaleString("fa-IR")} تومان*\n` +
    `⏰ هزینه ساعتی: *${hourlyCost > 0 ? hourlyCost.toLocaleString("fa-IR") + " تومان" : "تنظیم نشده"}*\n` +
    `⌛️ موجودی باقی‌مانده: *${hoursStr}*\n\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `🔑 توکن: ${tokenCode ? `\`${tokenCode}\`` : "—"}\n` +
    `${statusEmoji[tokenStatus]} وضعیت: *${statusLabel[tokenStatus]}*` +
    graceInfo + usageDuration + apiBlock;
};

// ── Activated Services ────────────────────────────────────────────────────────

export const ACTIVATED_SERVICES_MESSAGE = (apiId?: number | null, apiHash?: string | null): string => {
  const credBlock = apiId && apiHash
    ? `\n━━━━━━━━━━━━━━━━━\n🔑 *API اکانت شما:*\n` +
      `📌 API ID: \`${apiId}\`\n` +
      `🔐 API Hash: \`${apiHash}\`\n`
    : "";
  return (
    `✅ *اکانت شما فعال است*\n\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `از دکمه زیر می‌توانید اطلاعات API تلگرام خود را دریافت کنید:` +
    credBlock
  );
};

export const TELEGRAM_LOGIN_PROMPT = (): string =>
  `📱 *ورود به اکانت تلگرام*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `برای دریافت API ID و API Hash اکانت تلگرام خود:\n\n` +
  `۱. روی دکمه زیر بزنید تا شماره تلفن‌تان به اشتراک گذاشته شود\n` +
  `۲. کد تأییدیه‌ای از طرف تلگرام برایتان ارسال می‌شود\n` +
  `۳. کد را در ربات وارد کنید\n\n` +
  `⚠️ شماره تلفن باید همان اکانت فعلی تلگرام شما باشد.\n\n` +
  `↩️ برای انصراف /start بزنید`;

export const TELEGRAM_PHONE_RECEIVED = (phone: string): string =>
  `📲 *شماره دریافت شد: \`${esc(phone)}\`*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `⏳ در حال ارسال کد تأیید به تلگرام شما...\n` +
  `لطفاً چند لحظه صبر کنید.`;

export const TELEGRAM_CODE_PROMPT = (): string =>
  `✅ *کد تأیید ارسال شد*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `کد ۵ رقمی که تلگرام برایتان فرستاد را اینجا وارد کنید:\n\n` +
  `↩️ برای انصراف /start بزنید`;

export const TELEGRAM_LOGIN_SUCCESS = (apiId: number, apiHash: string): string =>
  `🎉 *اطلاعات API با موفقیت دریافت شد!*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `🔑 *API ID:*\n\`${apiId}\`\n\n` +
  `🔐 *API Hash:*\n\`${apiHash}\`\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `⚠️ این اطلاعات محرمانه هستند. آن‌ها را با کسی به اشتراک نگذارید.`;

export const TELEGRAM_LOGIN_ERROR = (): string =>
  `❌ *خطا در اتصال به تلگرام*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `در برقراری ارتباط با my.telegram.org مشکلی پیش آمد.\n\n` +
  `لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.`;

export const TELEGRAM_CODE_INVALID = (): string =>
  `❌ *کد وارد شده اشتباه است*\n\n` +
  `لطفاً کد صحیح را از پیام تلگرام خود کپی کنید و دوباره وارد کنید:\n\n` +
  `↩️ برای انصراف /start بزنید`;

export const TELEGRAM_PHONE_ERROR = (): string =>
  `❌ *خطا در ارسال کد تأیید*\n\n` +
  `━━━━━━━━━━━━━━━━━\n` +
  `امکان اتصال به my.telegram.org وجود ندارد.\n` +
  `ممکن است شماره اشتباه باشد یا اتصال اینترنت مشکل داشته باشد.\n\n` +
  `لطفاً دوباره امتحان کنید.`;
