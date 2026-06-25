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

export const ADD_BALANCE_MESSAGE = (cardNumber: string): string =>
  `➕ *افزایش موجودی*\n\n` +
  (cardNumber
    ? `💳 شماره کارت:\n\`${cardNumber}\`\n\n`
    : `⚠️ شماره کارت هنوز توسط ادمین تنظیم نشده است.\n\n`) +
  `مبلغ را واریز کرده و رسید (عکس یا متن) را ارسال کنید.\n` +
  `پس از تأیید ادمین، موجودی شما به‌روز می‌شود.\n\nبرای انصراف 🔙 را بزنید.`;

export const BALANCE_REQUEST_SENT = (): string =>
  `✅ *درخواست ثبت شد*\n\nدرخواست شما ارسال شد. پس از تأیید ادمین، موجودی شما به‌روز می‌شود.`;

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

export const APPROVE_LIST_MESSAGE = (
  requests: Array<{ id: string; userId: number; amount: number }>
): string => {
  if (requests.length === 0) return `✅ هیچ درخواست در انتظاری وجود ندارد.`;
  const lines = requests.map((r, i) =>
    `${i + 1}. کاربر: \`${r.userId}\` | مبلغ: *${r.amount > 0 ? r.amount.toLocaleString("fa-IR") + " تومان" : "نامشخص"}*\n   شناسه: \`${r.id}\``
  );
  return `📋 *درخواست‌های در انتظار*\n\n${lines.join("\n\n")}\n\n` +
    `برای تأیید: \`تایید [شناسه]\`\nبرای رد: \`رد [شناسه]\`\n\nبرای انصراف 🔙 را بزنید.`;
};

export const APPROVE_SUCCESS = (userId: number, amount: number): string =>
  `✅ *تأیید شد*\n\n${amount.toLocaleString("fa-IR")} تومان به کاربر \`${userId}\` اضافه شد.`;

export const APPROVE_FAILED = (): string =>
  `❌ درخواست یافت نشد یا قبلاً پردازش شده است.`;

export const ADMIN_TRANSFER_PROMPT = (): string =>
  `💸 *انتقال اعتبار کاربر*\n\n` +
  `فرمت: \`[شناسه مبدا] [شناسه مقصد] [مبلغ]\`\n\nمثال: \`111 222 5000\`\n\nبرای انصراف 🔙 را بزنید.`;

export const ADMIN_TRANSFER_SUCCESS = (from: number, to: number, amount: number): string =>
  `✅ *انتقال موفق*\n\n${amount.toLocaleString("fa-IR")} تومان از \`${from}\` به \`${to}\` منتقل شد.`;
