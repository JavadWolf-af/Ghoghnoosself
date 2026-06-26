# 🤖 Ghoghnoosself — ربات تلگرام سلف‌سرویس

ربات تلگرام سلف‌سرویس فارسی با سیستم کیف پول، زیرمجموعه‌گیری، پروفایل و پنل مدیریت حرفه‌ای.  
پایگاه داده **PostgreSQL** — مقیاس‌پذیر تا صدها هزار کاربر.

---

## ✨ امکانات

### کاربران
- 💰 **کیف پول** — موجودی، افزایش موجودی، انتقال اعتبار
- 👥 **زیر مجموعه گیری** — لینک دعوت اختصاصی، آمار زیرمجموعه
- 👤 **پروفایل** — اطلاعات حساب، موجودی، آمار
- 📞 **پشتیبانی (تیکت)** — سیستم تیکت با یادآور خودکار
- ⭐ **توکن** — فعال‌سازی امکانات حرفه‌ای
- ✅ بررسی خودکار عضویت در کانال
- 🔗 سیستم معرفی با لینک اختصاصی

### مدیران
- 📊 آمار کاربران و توکن‌ها
- 📢 ارسال پیام همگانی
- ➕ صدور توکن جدید
- 💳 تنظیم شماره کارت بانکی
- ✅ تأیید یا رد درخواست‌های افزایش موجودی
- 💸 انتقال اعتبار بین کاربران
- 🔍 جستجوی کاربر با آیدی یا یوزرنیم
- 🎫 مدیریت تیکت‌های پشتیبانی

---

## ⚡ نصب یک‌خطی

```bash
cd && curl -fsSL https://raw.githubusercontent.com/JavadWolf-af/Ghoghnoosself/main/install.sh | bash
```

> اگر از داخل پوشه Ghoghnoosself اجرا می‌کنید حتماً ابتدا `cd` بزنید.

اسکریپت به‌صورت خودکار همه موارد را نصب و تنظیم می‌کند:
- Git، Node.js 18+، PostgreSQL
- دیتابیس و کاربر PostgreSQL (با رمز تصادفی)
- Build ربات
- سرویس systemd یا pm2

---

## 🛠 پیش‌نیازها

اسکریپت نصب به‌طور خودکار همه موارد را نصب می‌کند:

| پیش‌نیاز | نسخه |
|---|---|
| Git | هر نسخه |
| Node.js | 18 یا بالاتر |
| PostgreSQL | 14 یا بالاتر |

---

## ⚙️ تنظیمات (.env)

| متغیر | توضیح | مثال |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | توکن ربات از @BotFather | `123456:ABCdef...` |
| `CHANNEL_USERNAME` | یوزرنیم کانال | `@MyChannel` |
| `CHANNEL_URL` | لینک کانال | `https://t.me/MyChannel` |
| `ADMIN_IDS` | شناسه عددی ادمین‌ها (با کاما) | `123456789,987654321` |
| `DATABASE_URL` | آدرس اتصال PostgreSQL | `postgresql://user:pass@localhost:5432/db` |
| `LOG_LEVEL` | سطح لاگ | `info` |
| `NODE_ENV` | محیط اجرا | `production` |

---

## 🗄️ پایگاه داده

پروژه از **PostgreSQL + Drizzle ORM** استفاده می‌کند.

- جداول به‌صورت خودکار در **اولین اجرا** ساخته می‌شوند
- نیاز به اجرای دستی migration نیست
- اتصال به DB از طریق متغیر `DATABASE_URL`

### اتصال مستقیم به دیتابیس

```bash
psql -U ghoghnoosself -d ghoghnoosself
```

---

## 🔄 آپدیت

```bash
update-ghoghnoosself
```

---

## 🗑 حذف کامل

```bash
uninstall-ghoghnoosself
```

---

## 🗂 ساختار فایل‌ها

```
Ghoghnoosself/
├── src/
│   ├── db/
│   │   ├── schema.ts     # اسکیمای Drizzle ORM
│   │   ├── client.ts     # اتصال به PostgreSQL
│   │   └── init.ts       # ساخت خودکار جداول
│   ├── bot/
│   │   ├── index.ts      # منطق اصلی ربات
│   │   ├── keyboards.ts  # کیبوردها و دکمه‌ها
│   │   ├── messages.ts   # متن‌های ربات
│   │   └── store.ts      # لایه دسترسی به داده (PostgreSQL)
│   ├── lib/
│   │   └── logger.ts     # سیستم لاگ
│   └── index.ts          # نقطه ورود
├── dist/                 # کد کامپایل‌شده
├── build.mjs             # اسکریپت ساخت
├── drizzle.config.ts     # تنظیمات Drizzle Kit
├── install.sh            # نصب خودکار
├── update.sh             # آپدیت خودکار
├── uninstall.sh          # حذف کامل
├── .env.example          # نمونه تنظیمات
└── package.json
```

---

## 📋 دستورات مفید

```bash
# مشاهده لاگ‌های ربات (systemd)
journalctl -u ghoghnoosself -f

# وضعیت سرویس
systemctl status ghoghnoosself

# ری‌استارت
systemctl restart ghoghnoosself

# اتصال مستقیم به دیتابیس
psql -U ghoghnoosself -d ghoghnoosself

# مشاهده کاربران
psql -U ghoghnoosself -d ghoghnoosself -c "SELECT id, first_name, balance FROM users;"
```

---

## 📈 ظرفیت

| تعداد کاربر | وضعیت |
|---|---|
| تا ۱۰,۰۰۰ نفر | ✅ بدون نیاز به تنظیم اضافه |
| ۱۰,۰۰۰ – ۱۰۰,۰۰۰ نفر | ✅ با connection pooling پیش‌فرض |
| بالاتر از ۱۰۰,۰۰۰ نفر | ✅ با تنظیم `max` در postgres-js |

---

## 🔒 امنیت

- هیچ‌گاه فایل `.env` را در GitHub آپلود نکنید
- توکن ربات را با کسی به اشتراک نگذارید
- ادمین‌ها فقط با شناسه عددی تلگرام تعریف می‌شوند
- رمز دیتابیس به‌صورت تصادفی توسط اسکریپت نصب تولید می‌شود

---

## 📄 لایسنس

MIT License — [JavadWolf-af](https://github.com/JavadWolf-af)
