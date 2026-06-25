export const WELCOME_MESSAGE = (firstName: string): string =>
  `✨ *${firstName}* عزیز، به ربات سلف خوش آمدید! ✨\n\n` +
  `🌟 از حضور گرم شما در کنار ما بی‌نهایت خوشحالیم.\n\n` +
  `📢 برای بهره‌مندی از تمامی امکانات و دریافت آخرین اخبار و به‌روزرسانی‌های ربات، لطفاً در کانال ما عضو شوید:\n\n` +
  `پس از عضویت، دنیایی از خدمات در انتظار شماست 🤖`;

export const ALREADY_MEMBER_MESSAGE = (firstName: string): string =>
  `✅ *${firstName}* عزیز، عضویت شما تأیید شد!\n\n` +
  `به ربات سلف خوش آمدید. از منوی زیر گزینه مورد نظر خود را انتخاب کنید 👇`;

export const NOT_MEMBER_MESSAGE = (): string =>
  `⚠️ متأسفانه هنوز در کانال عضو نشده‌اید.\n\n` +
  `لطفاً ابتدا در کانال عضو شوید و سپس دکمه «عضو شدم» را بزنید.`;

export const ADMIN_PANEL_MESSAGE = (): string =>
  `🔐 *پنل مدیریت*\n\n` +
  `خوش آمدید به پنل ادمین. یک گزینه را انتخاب کنید:`;

export const SUPPORT_MESSAGE = (): string =>
  `📞 *پشتیبانی*\n\n` +
  `برای ارتباط با پشتیبانی لطفاً پیام خود را ارسال کنید.\n` +
  `کارشناسان ما در اسرع وقت پاسخگوی شما خواهند بود. 🙏`;

export const BLOCKED_SUPPORT_MESSAGE = (): string =>
  `📞 *پشتیبانی*\n\n` +
  `حساب شما مسدود شده است.\n` +
  `برای پیگیری رفع مسدودیت، پیام خود را ارسال کنید. 🙏`;

export const STATS_MESSAGE = (
  userCount: number,
  tokenCount: number,
  unusedTokenCount: number
): string =>
  `📊 *آمار ربات*\n\n` +
  `👥 تعداد کاربران ثبت‌نام شده: *${userCount}* نفر\n` +
  `🔑 توکن‌های صادر شده: *${tokenCount}* عدد\n` +
  `✅ توکن‌های باقی‌مانده: *${unusedTokenCount}* عدد`;

export const BROADCAST_PROMPT = (): string =>
  `📢 *ارسال پیام همگانی*\n\n` +
  `پیام مورد نظر خود را ارسال کنید تا برای تمام کاربران فرستاده شود:`;

export const BROADCAST_SENT = (count: number): string =>
  `✅ پیام با موفقیت برای *${count}* کاربر ارسال شد.`;

export const TOKEN_CREATED_MESSAGE = (code: string): string =>
  `🔑 *توکن جدید ساخته شد!*\n\n` +
  `کد توکن:\n\`${code}\`\n\n` +
  `این کد را به کاربر مورد نظر ارسال کنید.\n` +
  `⚠️ هر توکن فقط یک بار قابل استفاده است.`;

export const TOKEN_ENTER_PROMPT = (): string =>
  `🔑 *افزودن توکن سلف*\n\n` +
  `لطفاً کد توکن دریافتی خود را وارد کنید:\n` +
  `_(مثال: SALF-AB12-CD34)_`;

export const TOKEN_SUCCESS_MESSAGE = (firstName: string): string =>
  `🎉 *تبریک ${firstName} عزیز!*\n\n` +
  `توکن شما با موفقیت فعال شد.\n` +
  `اکنون به تمام امکانات ربات سلف دسترسی دارید. 🚀`;

export const TOKEN_INVALID_MESSAGE = (): string =>
  `❌ *توکن نامعتبر*\n\n` +
  `کد وارد شده معتبر نیست.\n` +
  `لطفاً کد را بررسی کرده و دوباره امتحان کنید.`;

export const TOKEN_ALREADY_USED_MESSAGE = (): string =>
  `⚠️ *توکن قبلاً استفاده شده*\n\n` +
  `این توکن قبلاً توسط کاربر دیگری فعال شده است.\n` +
  `برای دریافت توکن جدید با پشتیبانی تماس بگیرید.`;

export const ALREADY_ACTIVATED_MESSAGE = (): string =>
  `✅ *حساب شما فعال است*\n\n` +
  `شما قبلاً توکن خود را فعال کرده‌اید و به تمام امکانات دسترسی دارید.`;

export const BALANCE_ENTER_AMOUNT = (): string =>
  `💰 *افزایش موجودی*\n\n` +
  `لطفاً مقدار واریزی را *بر حسب تومان* وارد کنید:\n` +
  `_(مثال: 50000)_`;

export const BALANCE_RECEIPT = (
  depositId: string,
  amount: number,
  cardNumber: string
): string =>
  `🧾 *رسید واریز*\n\n` +
  `🆔 شناسه رسید: \`${depositId}\`\n` +
  `💵 مبلغ: *${amount.toLocaleString("fa-IR")} تومان*\n\n` +
  `💳 شماره کارت واریز:\n\`${cardNumber}\`\n\n` +
  `✅ پس از واریز، لطفاً تصویر رسید بانکی را همین‌جا ارسال کنید.\n` +
  `⚠️ شناسه رسید را هنگام واریز یادداشت کنید.`;

export const BALANCE_RECEIPT_RECEIVED = (): string =>
  `✅ *رسید شما دریافت شد!*\n\n` +
  `درخواست افزایش موجودی شما در حال بررسی است.\n` +
  `پس از تایید توسط ادمین، موجودی شما افزایش می‌یابد. 🙏`;

export const BALANCE_INVALID_AMOUNT = (): string =>
  `❌ *مقدار نامعتبر*\n\n` +
  `لطفاً یک عدد صحیح وارد کنید.\n` +
  `_(مثال: 50000)_`;

export const BALANCE_APPROVED_MESSAGE = (amount: number, newBalance: number): string =>
  `✅ *موجودی شما افزایش یافت!*\n\n` +
  `💵 مبلغ: *${amount.toLocaleString("fa-IR")} تومان*\n` +
  `💰 موجودی فعلی: *${newBalance.toLocaleString("fa-IR")} تومان*\n\n` +
  `از اعتماد شما متشکریم. 🙏`;

export const BALANCE_REJECTED_MESSAGE = (): string =>
  `❌ *درخواست افزایش موجودی رد شد*\n\n` +
  `متأسفانه رسید ارسالی مورد تایید قرار نگرفت.\n` +
  `در صورت وجود مشکل با پشتیبانی تماس بگیرید. 📞`;

export const BLOCKED_MESSAGE = (): string =>
  `🚫 *حساب شما مسدود شد*\n\n` +
  `شما خلاف قوانین رفتار کردید و مسدود شدید.\n\n` +
  `تنها دسترسی به پشتیبانی امکان‌پذیر است تا زمانی که ادمین حساب شما را آزاد کند.`;

export const UNBLOCKED_MESSAGE = (): string =>
  `✅ *حساب شما آزاد شد*\n\n` +
  `محدودیت حساب شما برداشته شده است.\n` +
  `می‌توانید مجدداً از خدمات ربات استفاده کنید.`;

export const BLOCKED_ONLY_SUPPORT = (): string =>
  `🚫 *دسترسی محدود*\n\n` +
  `حساب شما مسدود است.\n` +
  `فقط می‌توانید با پشتیبانی تماس بگیرید.`;

export const ADMIN_DEPOSIT_REVIEW = (
  depositId: string,
  amount: number,
  userId: number,
  firstName: string,
  username?: string
): string =>
  `📥 *درخواست افزایش موجودی*\n\n` +
  `🆔 شناسه: \`${depositId}\`\n` +
  `👤 کاربر: *${firstName}*${username ? ` (@${username})` : ""}\n` +
  `🔢 آیدی کاربر: \`${userId}\`\n` +
  `💵 مبلغ: *${amount.toLocaleString("fa-IR")} تومان*\n\n` +
  `رسید واریز را در تصویر بالا مشاهده کنید.\n` +
  `یکی از گزینه‌های زیر را انتخاب کنید:`;

export const ADMIN_ADD_BALANCE_PROMPT = (): string =>
  `💰 *افزایش موجودی دستی*\n\n` +
  `آیدی عددی کاربر را وارد کنید:`;

export const ADMIN_ADD_BALANCE_AMOUNT_PROMPT = (firstName: string): string =>
  `👤 کاربر: *${firstName}*\n\n` +
  `مقدار افزایش موجودی را *بر حسب تومان* وارد کنید:`;

export const ADMIN_BALANCE_ADDED = (firstName: string, amount: number): string =>
  `✅ *موجودی افزایش یافت*\n\n` +
  `کاربر: *${firstName}*\n` +
  `مبلغ: *${amount.toLocaleString("fa-IR")} تومان*`;

export const ADMIN_USER_NOT_FOUND = (): string =>
  `❌ *کاربر پیدا نشد*\n\n` +
  `کاربری با این آیدی در ربات ثبت‌نام نکرده است.`;

export const ADMIN_INVALID_ID = (): string =>
  `❌ *آیدی نامعتبر*\n\n` +
  `لطفاً یک آیدی عددی معتبر وارد کنید.`;

export const ADMIN_MSG_TO_USER_PROMPT = (): string =>
  `📨 *پیام به کاربر*\n\n` +
  `متن پیامی که می‌خواهید به کاربر ارسال شود را بنویسید:`;

export const ADMIN_MSG_SENT = (): string =>
  `✅ پیام با موفقیت به کاربر ارسال شد.`;

export const ADMIN_DEPOSIT_APPROVED = (depositId: string): string =>
  `✅ درخواست \`${depositId}\` تایید شد و موجودی کاربر افزایش یافت.`;

export const ADMIN_DEPOSIT_REJECTED = (depositId: string): string =>
  `❌ درخواست \`${depositId}\` رد شد.`;

export const ADMIN_USER_BLOCKED = (firstName: string): string =>
  `🚫 کاربر *${firstName}* مسدود شد.`;

export const ADMIN_USER_UNBLOCKED = (firstName: string): string =>
  `✅ کاربر *${firstName}* آزاد شد.`;

export const DEPOSIT_NO_PENDING = (): string =>
  `⚠️ شما در حال حاضر درخواست افزایش موجودی فعالی ندارید.\n` +
  `لطفاً ابتدا از طریق منو درخواست جدید ثبت کنید.`;
