# Ghoghnoosself — ربات تلگرام سلف‌سرویس

ربات تلگرامی برای مدیریت خودکار یوزربات‌ها — هر کاربر با شماره خودش وارد می‌شه، ربات api_id و api_hash رو از my.telegram.org می‌گیره و ساعت رو روی اکانت خودش تنظیم می‌کنه.

---

## نصب سریع (روی سرور جدید)

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/JavadWolf-af/Ghoghnoosself/main/install.sh)
```

اسکریپت نصب خودکار انجام می‌دهد:
- تست دسترسی به `my.telegram.org` قبل از شروع
- نصب Node.js 20+، PostgreSQL، Chromium و همه وابستگی‌ها
- ساخت دیتابیس و فایل `.env`
- تست Puppeteer برای اطمینان از دسترسی به سایت تلگرام
- راه‌اندازی سرویس systemd یا pm2

---

## آپدیت

```bash
update-ghoghnoosself
```

---

## دستورات کمکی

| دستور | توضیح |
|---|---|
| `update-ghoghnoosself` | آپدیت به آخرین نسخه از GitHub |
| `uninstall-ghoghnoosself` | حذف کامل ربات |
| `backup-ghoghnoosself` | بکاپ از دیتابیس |
| `import-ghoghnoosself <file>` | ایمپورت بکاپ |

---

## لاگ‌ها

```bash
journalctl -u ghoghnoosself -f          # لاگ زنده
journalctl -u ghoghnoosself -n 50       # ۵۰ خط آخر
sudo systemctl status ghoghnoosself     # وضعیت سرویس
```

---

## فایل `.env`

```env
TELEGRAM_BOT_TOKEN=   # توکن ربات از @BotFather
CHANNEL_USERNAME=     # @ChannelUsername
CHANNEL_URL=          # https://t.me/Channel
ADMIN_IDS=            # شناسه عددی ادمین‌ها (با کاما جدا)
DATABASE_URL=         # postgresql://user:pass@localhost:5432/db
LOG_LEVEL=info
NODE_ENV=production
```

---

## معماری

```
src/
├── bot/
│   ├── index.ts           # هندلرهای اصلی ربات
│   ├── messages.ts        # متن‌های فارسی
│   ├── keyboards.ts       # کیبوردها
│   ├── store.ts           # لایه دیتابیس (Drizzle ORM)
│   ├── tg-api-fetcher.ts  # Puppeteer → my.telegram.org (گرفتن api_id)
│   └── userbot-manager.ts # GramJS userbot (ساعت روی اکانت کاربر)
├── db/
│   ├── schema.ts          # اسکیما PostgreSQL
│   └── client.ts
└── index.ts               # نقطه ورود
```

### فلو اتصال تلگرام کاربر

```
کاربر: "اتصال تلگرام"
  ↓
ربات شماره می‌گیره (contact sharing)
  ↓
Puppeteer → my.telegram.org/auth
  ↓ شماره + کد تأیید
api_id و api_hash ذخیره میشن
  ↓
کاربر می‌تونه ساعت رو روی اکانت خودش فعال کنه
```

### فلو ساعت (Clock)

```
کاربر: "فعال‌سازی ساعت"
  ↓
GramJS با api_id کاربر → کد به تلگرام کاربر
  ↓
کاربر کد وارد می‌کنه → session ذخیره میشه
  ↓
هر دقیقه: نام خانوادگی = ساعت ایران (bold unicode)
```

---

## Stack

- **Runtime**: Node.js 20+, TypeScript
- **Bot API**: node-telegram-bot-api
- **MTProto**: GramJS (telegram)
- **Automation**: Puppeteer (stealth script برای bypass bot detection)
- **DB**: PostgreSQL + Drizzle ORM
- **Build**: esbuild (ESM bundle)
- **Process**: systemd یا pm2

---

## نکات مهم

- سرور باید به `my.telegram.org` دسترسی داشته باشه (فیلتر نباشه)
- اسکریپت نصب قبل از شروع این دسترسی رو تست می‌کنه
- Puppeteer از stealth script استفاده می‌کنه تا bot detection دور زده بشه
- هر کاربر session و api credentials مستقل داره
