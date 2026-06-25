import type { UserRecord } from "./store";

export const WELCOME_MESSAGE = (firstName: string): string =>
  `✨ *${firstName}* عزیز، به ربات سلف خوش آمدید!\n\n` +
  `📢 برای دسترسی به تمام امکانات، ابتدا در کانال ما عضو شوید:`;

export const MAIN_MENU_MESSAGE = (firstName: string): string =>
  `👋 *${firstName}* عزیز، خوش آمدید!\n\n` +
  `از منوی زیر گزینه مورد نظر را انتخاب کنید 👇`;

export const NOT_MEMBER_MESSAGE = (): string =>
  `⚠️ هنوز عضو کانال نشده‌اید.\nلطفاً ابتدا عضو شوید سپس دکمه «✅ عضو شدم» را بزنید.`;

export const ADMIN_PANEL_MESSAGE = (): string =>
  `🔐 *پنل مدیریت*\n\nخوش آمدید به پنل ادمین.\nبرای دسترسی به امکانات، وارد مدیریت منو شوید:`;

export const ADMIN_MANAGE_MESSAGE = (): string =>
  `📋 *مدیریت منو*\n\nیک گزینه را انتخاب کنید:`;

export const SUPPORT_MESSAGE = (): string =>
  `📞 *پشتیبانی*\n\nپیام خود را ارسال کنید.\nکارشناسان در اسرع وقت پاسخ می‌دهند. 🙏`;

export const BLOCKED_SUPPORT_MESSAGE = (): string =>
  `📞 *پشتیبانی*\n\nحساب شما مسدود است.\nپیام خود را ارسال کنید تا بررسی شود. 🙏`;

// ── Token ─────────────────────────────────────────────────────────
export const TOKEN_SECTION_MESSAGE = (): string =>
  `⭐ *افزودن توکن*\n\n` +
  `این بخش برای فعال‌سازی امکانات حرفه‌ای طراحی شده است.\n\n` +
  `🔜 *به زودی:*\n` +
  `• دسترسی به سرویس‌های پیشرفته\n` +
  `• امکانات ویژه اعضای توکن‌دار\n\n` +
  `در صورت داشتن توکن، آن را وارد کنید:`;

export const TOKEN_ENTER_PROMPT = (): string =>
  `🔑 کد توکن دریافتی را وارد کنید:\n_(مثال: SALF-AB12-CD34)_\n\nبرای انصراف 🔙 را بزنید.`;

export const TOKEN_SUCCESS_MESSAGE = (firstName: string): string =>
  `🎉 *تبریک ${firstName} عزیز!*\n\nتوکن شما با موفقیت فعال شد. به امکانات ویژه دسترسی دارید. 🚀`;

export const TOKEN_INVALID_MESSAGE = (): string =>
  `❌ *توکن نامعتبر*\n\nکد صحیح نیست. لطفاً بررسی کنید و دوباره امتحان کنید.`;

export const TOKEN_ALREADY_USED_MESSAGE = (): string =>
  `⚠️ این توکن قبلاً استفاده شده است.\nبرای دریافت توکن جدید با پشتیبانی تماس بگیرید.`;

export const TOKEN_CREATED_MESSAGE = (code: string): string =>
  `🔑 *توکن جدید ساخته شد*\n\n\`${code}\`\n\n⚠️ هر توکن فقط یک بار قابل استفاده است.`;

// ── Wallet ────────────────────────────────────────────────────────
export const WALLET_MESSAGE = (balance: number): string =>
  `💰 *کیف پول*\n\nموجودی: *${balance.toLocaleString("fa-IR")} تومان*\n\nیک گزینه را انتخاب کنید:`;

export const ADD_BALANCE_AMOUNT_PROMPT = (): string =>
  `➕ *افزایش موجودی*\n\n` +
  `مقدار واریز را *بر حسب تومان* وارد کنید:\n` +
  `_(مثال: 50000)_\n\nبرای انصراف 🔙 را بزنید.`;

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

export const BLOCKED_MESSAGE = (): string =>
  `🚫 *حساب شما مسدود شد*\n\n` +
  `شما خلاف قوانین رفتار کردید و مسدود شدید.\n\n` +
  `تنها دسترسی به پشتیبانی امکان‌پذیر است تا زمانی که ادمین حساب شما را آزاد کند.`;

export const UNBLOCKED_MESSAGE = (): string =>
  `✅ *حساب شما آزاد شد*\n\n` +
  `محدودیت حساب شما برداشته شده است.\n` +
  `می‌توانید مجدداً از تمام خدمات استفاده کنید.`;

export const BLOCKED_ONLY_SUPPORT = (): string =>
  `🚫 *دسترسی محدود*\n\nحساب شما مسدود است.\nفقط می‌توانید با پشتیبانی تماس بگیرید.`;

export const TRANSFER_PROMPT = (): string =>
  `💸 *انتقال اعتبار*\n\nشناسه کاربر مقصد و مبلغ را وارد کنید:\n` +
  `\`[شناسه کاربر] [مبلغ]\`\n\nمثال: \`123456789 5000\`\n\nبرای انصراف 🔙 را بزنید.`;

export const TRANSFER_SUCCESS = (toUserId: number, amount: number): string =>
  `✅ *انتقال موفق*\n\n*${amount.toLocaleString("fa-IR")} تومان* به کاربر \`${toUserId}\` منتقل شد.`;

export const TRANSFER_FAILED = (reason: string): string => ({
  insufficient_balance: "❌ موجودی کافی ندارید.",
  target_not_found:     "❌ کاربر مقصد یافت نشد.",
  invalid_format:       "❌ فرمت نادرست.\nمثال: `123456789 5000`",
  invalid_amount:       "❌ مبلغ باید عدد مثبت باشد.",
}[reason] ?? "❌ خطا در انتقال. دوباره امتحان کنید.");

// ── Referral ──────────────────────────────────────────────────────
export const REFERRAL_MESSAGE = (user: UserRecord, botUsername: string): string =>
  `👥 *زیر مجموعه گیری*\n\n` +
  `🔗 لینک دعوت شما:\n\`https://t.me/${botUsername}?start=${user.referralCode}\`\n\n` +
  `👤 تعداد زیرمجموعه: *${user.referralCount}* نفر\n\n` +
  `این لینک را به دوستان خود ارسال کنید.`;

// ── Profile ───────────────────────────────────────────────────────
export const PROFILE_MESSAGE = (user: UserRecord): string =>
  `👤 *پروفایل*\n\n` +
  `🆔 شناسه: \`${user.id}\`\n` +
  `👤 نام: *${user.firstName}${user.lastName ? " " + user.lastName : ""}*\n` +
  (user.username ? `📎 یوزرنیم: @${user.username}\n` : "") +
  `📅 تاریخ عضویت: ${user.joinedAt.toLocaleDateString("fa-IR")}\n` +
  `💰 موجودی: *${user.balance.toLocaleString("fa-IR")} تومان*\n` +
  `👥 زیرمجموعه: *${user.referralCount}* نفر`;

// ── Admin ─────────────────────────────────────────────────────────
export const STATS_MESSAGE = (users: number, tokens: number, unused: number): string =>
  `📊 *آمار ربات*\n\n` +
  `👥 کاربران: *${users}* نفر\n` +
  `🔑 توکن صادر شده: *${tokens}*\n` +
  `✅ توکن باقی‌مانده: *${unused}*`;

export const BROADCAST_PROMPT = (): string =>
  `📢 *ارسال پیام همگانی*\n\nپیام را ارسال کنید:\n\nبرای انصراف 🔙 را بزنید.`;

export const BROADCAST_SENT = (count: number): string =>
  `✅ پیام برای *${count}* کاربر ارسال شد.`;

export const CARD_NUMBER_PROMPT = (): string =>
  `💳 *تنظیم شماره کارت*\n\nشماره کارت جدید را وارد کنید:\n_(مثال: 6037-9975-1234-5678)_\n\nبرای انصراف 🔙 را بزنید.`;

export const CARD_NUMBER_SET = (card: string): string =>
  `✅ شماره کارت ذخیره شد:\n\`${card}\``;

export const ADMIN_DEPOSIT_REVIEW = (
  requestId: string, amount: number, userId: number, firstName: string, username?: string
): string =>
  `📥 *درخواست افزایش موجودی*\n\n` +
  `🆔 شناسه: \`${requestId}\`\n` +
  `👤 کاربر: *${firstName}*${username ? ` (@${username})` : ""}\n` +
  `🔢 آیدی: \`${userId}\`\n` +
  `💵 مبلغ: *${amount.toLocaleString("fa-IR")} تومان*\n\n` +
  `رسید واریز را بالا مشاهده کنید. یک گزینه انتخاب کنید:`;

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
  `💸 *انتقال اعتبار کاربر*\n\n` +
  `فرمت: \`[شناسه مبدا] [شناسه مقصد] [مبلغ]\`\n\nمثال: \`111 222 5000\`\n\nبرای انصراف 🔙 را بزنید.`;

export const ADMIN_TRANSFER_SUCCESS = (from: number, to: number, amount: number): string =>
  `✅ *انتقال موفق*\n\n${amount.toLocaleString("fa-IR")} تومان از \`${from}\` به \`${to}\` منتقل شد.`;
