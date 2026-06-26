import type { UserRecord } from "./store";

export const WELCOME_MESSAGE = (firstName: string): string =>
  `✨ *${firstName}* عزیز، به ربات سلف خوش آمدید!\n\n` +
  `📢 برای دسترسی به تمام امکانات، ابتدا در کانال ما عضو شوید:`;

export const MAIN_MENU_MESSAGE = (firstName: string): string =>
  `👋 *${firstName}* عزیز، خوش آمدید!\n\nاز منوی زیر گزینه مورد نظر را انتخاب کنید 👇`;

export const NOT_MEMBER_MESSAGE = (): string =>
  `⚠️ هنوز عضو کانال نشده‌اید.\nلطفاً ابتدا عضو شوید سپس دکمه «✅ عضو شدم» را بزنید.`;

export const MEMBERSHIP_CHECK_FAILED_MESSAGE = (): string =>
  `⚠️ *خطا در بررسی عضویت*\n\n` +
  `در حال حاضر امکان بررسی عضویت وجود ندارد.\n` +
  `لطفاً چند دقیقه صبر کنید و دوباره /start را بزنید.`;

export const ADMIN_PANEL_MESSAGE = (): string =>
  `🔐 *پنل مدیریت*\n\nخوش آمدید به پنل ادمین.\nبرای دسترسی به امکانات، وارد مدیریت منو شوید:`;

export const ADMIN_MANAGE_MESSAGE = (): string =>
  `📋 *مدیریت منو*\n\nیک گزینه را انتخاب کنید:`;

// ── Support / Ticket ──────────────────────────────────────────────────────────

export const SUPPORT_PROMPT = (): string =>
  `📞 *پشتیبانی*\n\nپیام خود را بنویسید.\nیک تیکت برای شما ثبت و در اسرع وقت پاسخ داده می‌شود 🙏\n\nبرای انصراف 🔙 را بزنید.`;

export const TICKET_CREATED_USER = (ticketId: string): string =>
  `✅ *تیکت شما ثبت شد*\n\n` +
  `🎫 شماره تیکت: \`${ticketId}\`\n\n` +
  `پیام شما دریافت شد. پشتیبانی در اسرع وقت پاسخ می‌دهد. 🙏`;

export const TICKET_REPLY_USER = (ticketId: string, replyText: string): string =>
  `📨 *پاسخ پشتیبانی*\n\n` +
  `🎫 تیکت: \`${ticketId}\`\n\n` +
  `${replyText}`;

export const TICKET_CLOSED_USER = (ticketId: string): string =>
  `🔒 *تیکت بسته شد*\n\n` +
  `🎫 شماره تیکت: \`${ticketId}\`\n\n` +
  `تیکت شما توسط پشتیبانی بسته شد.\nاگر مشکل برطرف نشده، دوباره با پشتیبانی تماس بگیرید.`;

export const TICKET_ADDED_USER = (ticketId: string): string =>
  `✅ *پیام شما اضافه شد*\n\n` +
  `🎫 تیکت: \`${ticketId}\`\n\n` +
  `پیام شما به تیکت موجود اضافه شد. منتظر پاسخ باشید. 🙏`;

export const ADMIN_NEW_TICKET = (
  ticketId: string, userId: number, firstName: string,
  username: string | undefined, text: string
): string =>
  `🎫 *تیکت پشتیبانی جدید*\n\n` +
  `🆔 شماره: \`${ticketId}\`\n` +
  `👤 کاربر: *${firstName}*${username ? ` (@${username})` : ""}\n` +
  `🔢 آیدی: \`${userId}\`\n\n` +
  `💬 پیام:\n${text}`;

export const ADMIN_TICKET_FOLLOWUP = (
  ticketId: string, userId: number, firstName: string,
  username: string | undefined, text: string
): string =>
  `📩 *پیام جدید در تیکت*\n\n` +
  `🆔 شماره: \`${ticketId}\`\n` +
  `👤 کاربر: *${firstName}*${username ? ` (@${username})` : ""}\n` +
  `🔢 آیدی: \`${userId}\`\n\n` +
  `💬 پیام:\n${text}`;

export const ADMIN_TICKET_REPLY_PROMPT = (ticketId: string): string =>
  `✏️ *پاسخ به تیکت \`${ticketId}\`*\n\nپیام پاسخ را بنویسید:\n\nبرای انصراف 🔙 را بزنید.`;

export const ADMIN_TICKET_REPLY_SENT = (ticketId: string): string =>
  `✅ پاسخ به تیکت \`${ticketId}\` ارسال شد.`;

export const ADMIN_TICKET_CLOSED = (ticketId: string): string =>
  `🔒 تیکت \`${ticketId}\` بسته شد.`;

export const ADMIN_TICKET_ALREADY_CLOSED = (ticketId: string): string =>
  `⚠️ تیکت \`${ticketId}\` قبلاً بسته شده است.`;

// ── Blocked user support ──────────────────────────────────────────────────────

export const BLOCKED_SUPPORT_PROMPT = (): string =>
  `📞 *پشتیبانی*\n\n` +
  `حساب شما مسدود شده است.\n` +
  `پیام خود را بنویسید تا به پشتیبانی ارسال شود:\n\nبرای انصراف 🔙 را بزنید.`;

export const BLOCKED_SUPPORT_SENT = (): string =>
  `📨 *پیام شما ارسال شد*\n\nپیام شما به پشتیبانی ارسال شد.\nمنتظر پاسخ باشید. 🙏`;

export const BLOCKED_ONLY_SUPPORT = (): string =>
  `🚫 *دسترسی محدود*\n\nحساب شما مسدود است.\nفقط می‌توانید با پشتیبانی تماس بگیرید.`;

// ── Token ─────────────────────────────────────────────────────────────────────

export const TOKEN_SECTION_MESSAGE = (): string =>
  `⭐ *افزودن توکن*\n\n` +
  `این بخش برای فعال‌سازی امکانات ویژه طراحی شده است.\n\n` +
  `در صورت داشتن توکن، آن را وارد کنید:`;

export const TOKEN_ALREADY_ACTIVATED_MESSAGE = (): string =>
  `✅ *حساب شما فعال است*\n\nشما قبلاً توکن خود را فعال کرده‌اید و به تمام امکانات دسترسی دارید.`;

export const TOKEN_SUCCESS_MESSAGE = (firstName: string): string =>
  `🎉 *تبریک ${firstName} عزیز!*\n\nتوکن شما با موفقیت فعال شد. به امکانات ویژه دسترسی دارید. 🚀`;

export const TOKEN_INVALID_MESSAGE = (): string =>
  `❌ *توکن نامعتبر*\n\nکد صحیح نیست. لطفاً بررسی کنید و دوباره امتحان کنید.`;

export const TOKEN_ALREADY_USED_MESSAGE = (): string =>
  `⚠️ این توکن قبلاً استفاده شده است.\nبرای دریافت توکن جدید با پشتیبانی تماس بگیرید.`;

export const TOKEN_CREATED_MESSAGE = (code: string): string =>
  `🔑 *توکن جدید ساخته شد*\n\n\`${code}\`\n\n⚠️ هر توکن فقط یک بار قابل استفاده است.`;

// ── Wallet ────────────────────────────────────────────────────────────────────

export const WALLET_MESSAGE = (balance: number): string =>
  `💰 *کیف پول*\n\nموجودی: *${balance.toLocaleString("fa-IR")} تومان*\n\nیک گزینه را انتخاب کنید:`;

export const ADD_BALANCE_AMOUNT_PROMPT = (): string =>
  `➕ *افزایش موجودی*\n\nمقدار واریز را *بر حسب تومان* وارد کنید:\n\nبرای انصراف 🔙 را بزنید.`;

export const ADD_BALANCE_RECEIPT = (receiptId: string, amount: number, cardNumber: string): string =>
  `🧾 *رسید واریز*\n\n` +
  `🆔 شناسه رسید: \`${receiptId}\`\n` +
  `💵 مبلغ: *${amount.toLocaleString("fa-IR")} تومان*\n\n` +
  `💳 شماره کارت:\n\`${cardNumber || "هنوز توسط ادمین تنظیم نشده"}\`\n\n` +
  `✅ پس از واریز، تصویر رسید بانکی را همین‌جا ارسال کنید.\n` +
  `⚠️ شناسه رسید را هنگام واریز یادداشت کنید.\n\nبرای انصراف 🔙 را بزنید.`;

export const BALANCE_REQUEST_SENT = (): string =>
  `✅ *رسید دریافت شد*\n\nدرخواست شما ارسال شد. پس از تأیید ادمین، موجودی شما به‌روز می‌شود.`;

export const BALANCE_APPROVED_USER = (amount: number, newBalance: number): string =>
  `✅ *موجودی افزایش یافت*\n\n` +
  `💵 مبلغ: *${amount.toLocaleString("fa-IR")} تومان*\n` +
  `💰 موجودی فعلی: *${newBalance.toLocaleString("fa-IR")} تومان*\n\nاز اعتماد شما متشکریم. 🙏`;

export const BALANCE_REJECTED_USER = (): string =>
  `❌ *درخواست رد شد*\n\nرسید ارسالی مورد تأیید قرار نگرفت.\nدر صورت مشکل با پشتیبانی تماس بگیرید. 📞`;

// ── Block / Unblock ───────────────────────────────────────────────────────────

export const BLOCKED_MESSAGE = (): string =>
  `🚫 *حساب شما مسدود شد*\n\n` +
  `شما خلاف قوانین رفتار کردید و مسدود شدید.\n\n` +
  `تنها دسترسی به پشتیبانی امکان‌پذیر است تا زمانی که ادمین حساب شما را آزاد کند.`;

export const UNBLOCKED_MESSAGE = (): string =>
  `✅ *حساب شما آزاد شد*\n\nمحدودیت حساب شما برداشته شده است.\nمی‌توانید مجدداً از تمام خدمات استفاده کنید.`;

// ── Transfer ──────────────────────────────────────────────────────────────────

export const TRANSFER_PROMPT = (): string =>
  `💸 *انتقال اعتبار*\n\nشناسه کاربر مقصد و مبلغ را وارد کنید:\n\`[شناسه کاربر] [مبلغ]\`\n\nبرای انصراف 🔙 را بزنید.`;

export const TRANSFER_SUCCESS = (toUserId: number, amount: number): string =>
  `✅ *انتقال موفق*\n\n*${amount.toLocaleString("fa-IR")} تومان* به کاربر \`${toUserId}\` منتقل شد.`;

export const TRANSFER_FAILED = (reason: string): string => ({
  insufficient_balance: "❌ موجودی کافی ندارید.",
  target_not_found:     "❌ کاربر مقصد یافت نشد.",
  invalid_format:       "❌ فرمت نادرست.\nشناسه کاربر و مبلغ را جداگانه وارد کنید.",
  invalid_amount:       "❌ مبلغ باید عدد مثبت باشد.",
}[reason] ?? "❌ خطا در انتقال. دوباره امتحان کنید.");

// ── Profile / Referral ────────────────────────────────────────────────────────

export const REFERRAL_MESSAGE = (user: UserRecord, botUsername: string): string =>
  `👥 *زیر مجموعه گیری*\n\n` +
  `🔗 لینک دعوت شما:\n\`https://t.me/${botUsername}?start=${user.referralCode}\`\n\n` +
  `👤 تعداد زیرمجموعه: *${user.referralCount}* نفر\n\nاین لینک را به دوستان خود ارسال کنید.`;

export const PROFILE_MESSAGE = (user: UserRecord): string =>
  `👤 *پروفایل*\n\n` +
  `🆔 شناسه: \`${user.id}\`\n` +
  `👤 نام: *${user.firstName}${user.lastName ? " " + user.lastName : ""}*\n` +
  (user.username ? `📎 یوزرنیم: @${user.username}\n` : "") +
  `📅 تاریخ عضویت: ${user.joinedAt.toLocaleDateString("fa-IR")}\n` +
  `💰 موجودی: *${user.balance.toLocaleString("fa-IR")} تومان*\n` +
  `👥 زیرمجموعه: *${user.referralCount}* نفر`;

// ── Admin panel ───────────────────────────────────────────────────────────────

export const STATS_MESSAGE = (users: number, tokens: number, unused: number, openTickets: number): string =>
  `📊 *آمار ربات*\n\n` +
  `👥 کاربران: *${users}* نفر\n` +
  `🔑 توکن صادر شده: *${tokens}*\n` +
  `✅ توکن باقی‌مانده: *${unused}*\n` +
  `🎫 تیکت‌های باز: *${openTickets}*`;

export const BROADCAST_PROMPT = (): string =>
  `📢 *ارسال پیام همگانی*\n\nپیام را ارسال کنید:\n\nبرای انصراف 🔙 را بزنید.`;

export const BROADCAST_SENT = (count: number): string =>
  `✅ پیام برای *${count}* کاربر ارسال شد.`;

export const CARD_NUMBER_PROMPT = (): string =>
  `💳 *تنظیم شماره کارت*\n\nشماره کارت جدید را وارد کنید:\n\nبرای انصراف 🔙 را بزنید.`;

export const CARD_NUMBER_SET = (card: string): string =>
  `✅ شماره کارت ذخیره شد:\n\`${card}\``;

export const BLOCKED_LIST_MESSAGE = (
  blockedUsers: Array<{ id: number; firstName: string; username?: string }>
): string => {
  if (blockedUsers.length === 0) return `✅ هیچ کاربر مسدودی وجود ندارد.`;
  const lines = blockedUsers.map((u, i) =>
    `${i + 1}. *${u.firstName}*${u.username ? ` (@${u.username})` : ""} — \`${u.id}\``
  );
  return `🚫 *لیست کاربران مسدود* (${blockedUsers.length} نفر)\n\n${lines.join("\n")}\n\nبرای آزادسازی روی دکمه زیر هر کاربر کلیک کنید:`;
};

export const ADMIN_DEPOSIT_REVIEW = (
  requestId: string, amount: number, userId: number, firstName: string, username?: string
): string =>
  `📥 *درخواست افزایش موجودی*\n\n` +
  `🆔 شناسه: \`${requestId}\`\n` +
  `👤 کاربر: *${firstName}*${username ? ` (@${username})` : ""}\n` +
  `🔢 آیدی: \`${userId}\`\n` +
  `💵 مبلغ: *${amount.toLocaleString("fa-IR")} تومان*\n\nرسید واریز را بالا مشاهده کنید:`;

export const ADMIN_SUPPORT_FROM_BLOCKED = (
  userId: number, firstName: string, username: string | undefined, text: string
): string =>
  `📞 *پیام پشتیبانی از کاربر مسدود*\n\n` +
  `👤 کاربر: *${firstName}*${username ? ` (@${username})` : ""}\n` +
  `🔢 آیدی: \`${userId}\`\n\n` +
  `💬 پیام:\n${text}`;

export const ADMIN_ADD_BALANCE_PROMPT = (): string =>
  `💰 *افزایش موجودی دستی*\n\nآیدی عددی کاربر را وارد کنید:\n\nبرای انصراف 🔙 را بزنید.`;

export const ADMIN_ADD_BALANCE_AMOUNT_PROMPT = (firstName: string): string =>
  `👤 کاربر: *${firstName}*\n\nمقدار افزایش موجودی را *بر حسب تومان* وارد کنید:\n\nبرای انصراف 🔙 را بزنید.`;

export const ADMIN_BALANCE_ADDED = (firstName: string, userId: number, amount: number): string =>
  `✅ *موجودی افزایش یافت*\n\nکاربر: *${firstName}* (\`${userId}\`)\nمبلغ: *${amount.toLocaleString("fa-IR")} تومان*`;

export const ADMIN_USER_NOT_FOUND = (): string =>
  `❌ *کاربر پیدا نشد*\n\nکاربری با این آیدی در ربات ثبت‌نام نکرده است.`;

export const ADMIN_INVALID_ID = (): string =>
  `❌ *آیدی نامعتبر*\n\nلطفاً یک عدد صحیح وارد کنید.`;

export const ADMIN_MSG_PROMPT = (): string =>
  `📨 *پیام به کاربر*\n\nمتن پیام را بنویسید:\n\nبرای انصراف 🔙 را بزنید.`;

export const ADMIN_MSG_SENT = (): string =>
  `✅ پیام با موفقیت به کاربر ارسال شد.`;

export const ADMIN_DEPOSIT_APPROVED = (requestId: string): string =>
  `✅ درخواست \`${requestId}\` تأیید شد.`;

export const ADMIN_DEPOSIT_REJECTED = (requestId: string): string =>
  `❌ درخواست \`${requestId}\` رد شد.`;

export const ADMIN_USER_BLOCKED = (firstName: string, userId: number): string =>
  `🚫 کاربر *${firstName}* (\`${userId}\`) مسدود شد.`;

export const ADMIN_USER_UNBLOCKED = (firstName: string, userId: number): string =>
  `✅ کاربر *${firstName}* (\`${userId}\`) آزاد شد.`;

export const ADMIN_TRANSFER_PROMPT = (): string =>
  `💸 *انتقال اعتبار کاربر*\n\nفرمت: \`[شناسه مبدا] [شناسه مقصد] [مبلغ]\`\n\nبرای انصراف 🔙 را بزنید.`;

export const ADMIN_TRANSFER_SUCCESS = (from: number, to: number, amount: number): string =>
  `✅ *انتقال موفق*\n\n${amount.toLocaleString("fa-IR")} تومان از \`${from}\` به \`${to}\` منتقل شد.`;

// ── Ticket Reminder ───────────────────────────────────────────────────────────

export const ADMIN_TICKET_REMINDER = (
  ticketId: string,
  userId: number,
  firstName: string,
  username: string | undefined,
  lastMessageText: string,
  waitHours: number,
): string =>
  `⏰ *یادآوری تیکت بی‌پاسخ*\n\n` +
  `🎫 تیکت: \`${ticketId}\`\n` +
  `👤 کاربر: *${firstName}*${username ? ` (@${username})` : ""}\n` +
  `🔢 آیدی: \`${userId}\`\n` +
  `🕐 بیش از *${waitHours} ساعت* بدون پاسخ\n\n` +
  `💬 آخرین پیام کاربر:\n_${lastMessageText.slice(0, 200)}${lastMessageText.length > 200 ? "…" : ""}_`;
