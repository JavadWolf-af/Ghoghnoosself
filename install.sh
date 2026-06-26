#!/usr/bin/env bash
set -euo pipefail

cd "$HOME" 2>/dev/null || cd /tmp

REPO="https://github.com/JavadWolf-af/Ghoghnoosself"
INSTALL_DIR="$HOME/Ghoghnoosself"
SERVICE_NAME="ghoghnoosself"
NODE_MIN_VERSION=20
BIN_UPDATE="/usr/local/bin/update-ghoghnoosself"
BIN_UNINSTALL="/usr/local/bin/uninstall-ghoghnoosself"
BIN_BACKUP="/usr/local/bin/backup-ghoghnoosself"
BIN_IMPORT="/usr/local/bin/import-ghoghnoosself"
DB_NAME="ghoghnoosself"
DB_USER="ghoghnoosself"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

echo ""
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo -e "${CYAN}   ربات تلگرام سلف — نصب خودکار v2.1     ${NC}"
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo ""

OS="$(uname -s)"
[[ "$OS" != "Linux" && "$OS" != "Darwin" ]] && error "Only Linux/macOS supported."

install_package() {
  local pkg="$1"
  if command -v apt-get &>/dev/null; then sudo apt-get install -y "$pkg" >/dev/null 2>&1
  elif command -v yum &>/dev/null; then sudo yum install -y "$pkg" >/dev/null 2>&1
  elif command -v dnf &>/dev/null; then sudo dnf install -y "$pkg" >/dev/null 2>&1
  elif command -v brew &>/dev/null; then brew install "$pkg" >/dev/null 2>&1
  else error "Cannot install $pkg automatically."; fi
}

# ── تست اتصال ────────────────────────────────────────────────────────────────
info "تست اتصال به اینترنت..."
if ! curl -sf --max-time 5 https://api.telegram.org > /dev/null 2>&1; then
  error "اتصال به api.telegram.org ممکن نیست. لطفاً اتصال اینترنت سرور را بررسی کنید."
fi
success "اتصال به Telegram API: ✓"

info "تست دسترسی به my.telegram.org..."
TG_WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://my.telegram.org/auth 2>/dev/null || echo "000")
if [[ "$TG_WEB_STATUS" == "200" ]]; then
  success "my.telegram.org: ✓ (HTTP 200)"
else
  warn "my.telegram.org برگرداند: HTTP $TG_WEB_STATUS"
  warn "شاید این سرور نتواند به my.telegram.org متصل شود."
  warn "ربات نصب می‌شود ولی قابلیت دریافت API credentials ممکن است کار نکند."
  echo ""
  read -rp "  ادامه می‌دهید؟ (y/n): " CONT
  [[ "$CONT" != "y" && "$CONT" != "Y" ]] && exit 0
fi

# ── Git ───────────────────────────────────────────────────────────────────────
info "بررسی Git..."
if ! command -v git &>/dev/null; then
  info "نصب Git..."
  if command -v apt-get &>/dev/null; then
    sudo apt-get update -qq >/dev/null 2>&1
    install_package git
  else install_package git; fi
fi
success "Git: $(git --version)"

# ── Node.js 20+ ───────────────────────────────────────────────────────────────
info "بررسی Node.js (حداقل v${NODE_MIN_VERSION})..."
NEED_NODE=0
if ! command -v node &>/dev/null; then NEED_NODE=1
else
  NODE_VER=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
  [[ "$NODE_VER" -lt "$NODE_MIN_VERSION" ]] && NEED_NODE=1
fi

if [[ "$NEED_NODE" -eq 1 ]]; then
  info "نصب Node.js 20 LTS..."
  if command -v apt-get &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - >/dev/null 2>&1
    sudo apt-get install -y nodejs >/dev/null 2>&1
  elif command -v yum &>/dev/null || command -v dnf &>/dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - >/dev/null 2>&1
    PKG_MGR="yum"; command -v dnf &>/dev/null && PKG_MGR="dnf"
    sudo $PKG_MGR install -y nodejs >/dev/null 2>&1
  elif command -v brew &>/dev/null; then
    brew install node@20 >/dev/null 2>&1
  else
    error "Node.js پیدا نشد. از https://nodejs.org نصب کنید (v20+)."
  fi
fi
NODE_VER_FINAL=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
[[ "$NODE_VER_FINAL" -lt "$NODE_MIN_VERSION" ]] && error "Node.js >= $NODE_MIN_VERSION مورد نیاز است."
success "Node.js: $(node --version)"

# ── وابستگی‌های سیستمی Puppeteer/Chromium ────────────────────────────────────
info "نصب وابستگی‌های سیستمی Chromium (headless browser)..."
if command -v apt-get &>/dev/null; then
  sudo apt-get update -qq >/dev/null 2>&1 || true
  sudo apt-get install -y \
    ca-certificates curl wget gnupg \
    fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
    libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
    libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
    libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
    lsb-release xdg-utils >/dev/null 2>&1
  success "وابستگی‌های Chromium نصب شدند."
elif command -v yum &>/dev/null || command -v dnf &>/dev/null; then
  PKG_MGR="yum"; command -v dnf &>/dev/null && PKG_MGR="dnf"
  sudo $PKG_MGR install -y \
    alsa-lib atk cups-libs dbus-libs expat fontconfig libgbm gtk3 \
    libX11 libXcomposite libXcursor libXdamage libXext libXfixes libXi \
    libXrandr libXrender libXtst nss pango xdg-utils >/dev/null 2>&1 || true
  success "وابستگی‌های Chromium بررسی شدند."
fi

# ── PostgreSQL ────────────────────────────────────────────────────────────────
info "بررسی PostgreSQL..."
if ! command -v psql &>/dev/null; then
  info "نصب PostgreSQL..."
  if command -v apt-get &>/dev/null; then
    sudo apt-get install -y postgresql postgresql-contrib >/dev/null 2>&1
  elif command -v yum &>/dev/null || command -v dnf &>/dev/null; then
    PKG_MGR="yum"; command -v dnf &>/dev/null && PKG_MGR="dnf"
    sudo $PKG_MGR install -y postgresql-server postgresql-contrib >/dev/null 2>&1
    sudo postgresql-setup --initdb >/dev/null 2>&1 || true
  elif command -v brew &>/dev/null; then
    brew install postgresql@16 >/dev/null 2>&1
    brew services start postgresql@16 >/dev/null 2>&1 || true
  else
    error "PostgreSQL پیدا نشد. دستی نصب کنید."
  fi
fi

# راه‌اندازی PostgreSQL
if command -v systemctl &>/dev/null; then
  sudo systemctl enable postgresql >/dev/null 2>&1 || true
  sudo systemctl start  postgresql >/dev/null 2>&1 || true
fi
success "PostgreSQL: $(psql --version)"

# ── دانلود ربات ───────────────────────────────────────────────────────────────
if [[ -d "$INSTALL_DIR" ]]; then
  warn "پوشه قبلی موجود است."
  [[ -f "$INSTALL_DIR/.env" ]] && cp "$INSTALL_DIR/.env" /tmp/.env_ghoghnoos_bak && info ".env بکاپ گرفته شد."
  rm -rf "$INSTALL_DIR"
fi

info "دانلود ربات از GitHub..."
git clone "$REPO" "$INSTALL_DIR"
cd "$INSTALL_DIR"

if [[ -f /tmp/.env_ghoghnoos_bak ]]; then
  cp /tmp/.env_ghoghnoos_bak "$INSTALL_DIR/.env"
  rm -f /tmp/.env_ghoghnoos_bak
  success "فایل .env قبلی بازگردانده شد."
fi

# ── PostgreSQL DB setup ───────────────────────────────────────────────────────
if [[ ! -f "$INSTALL_DIR/.env" ]]; then
  info "ساخت کاربر و پایگاه داده PostgreSQL..."
  DB_PASS=$(openssl rand -base64 16 | tr -d '/+=\n' | head -c 20)

  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || \
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
  success "دیتابیس ساخته شد: $DB_NAME"

  DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"

  cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"

  echo ""
  warn "═══ اطلاعات ربات را وارد کنید ═══"
  echo ""
  read -rp "  Bot token (از @BotFather): " BOT_TOKEN
  read -rp "  Channel username (مثلاً @MyChannel): " CH_USER
  read -rp "  Channel URL (مثلاً https://t.me/MyChannel): " CH_URL
  read -rp "  Admin Telegram ID (عدد): " ADM_IDS
  echo ""

  sed -i.bak \
    -e "s|1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ|${BOT_TOKEN}|" \
    -e "s|CHANNEL_USERNAME=@YourChannel|CHANNEL_USERNAME=${CH_USER}|" \
    -e "s|CHANNEL_URL=https://t.me/YourChannel|CHANNEL_URL=${CH_URL}|" \
    -e "s|ADMIN_IDS=123456789,987654321|ADMIN_IDS=${ADM_IDS}|" \
    -e "s|DATABASE_URL=postgresql://ghoghnoosself:your_password@localhost:5432/ghoghnoosself|DATABASE_URL=${DATABASE_URL}|" \
    "$INSTALL_DIR/.env"
  rm -f "$INSTALL_DIR/.env.bak"
  success "فایل .env پر شد."
else
  success "فایل .env از قبل موجود است."
  if ! grep -q "DATABASE_URL" "$INSTALL_DIR/.env"; then
    warn "DATABASE_URL در .env یافت نشد."
    read -rp "  DATABASE_URL: " DB_URL_INPUT
    echo "DATABASE_URL=${DB_URL_INPUT}" >> "$INSTALL_DIR/.env"
  fi
fi

# ── ساخت دستورات کمکی ────────────────────────────────────────────────────────
info "ساخت دستورات کمکی..."
printf '#!/usr/bin/env bash\nbash "%s/update.sh"\n' "$INSTALL_DIR"    | sudo tee "$BIN_UPDATE"    > /dev/null
printf '#!/usr/bin/env bash\nbash "%s/uninstall.sh"\n' "$INSTALL_DIR" | sudo tee "$BIN_UNINSTALL" > /dev/null
printf '#!/usr/bin/env bash\nbash "%s/backup.sh"\n' "$INSTALL_DIR"    | sudo tee "$BIN_BACKUP"    > /dev/null
printf '#!/usr/bin/env bash\nbash "%s/import.sh" "$@"\n' "$INSTALL_DIR" | sudo tee "$BIN_IMPORT"  > /dev/null
sudo chmod +x "$BIN_UPDATE" "$BIN_UNINSTALL" "$BIN_BACKUP" "$BIN_IMPORT"
success "update / uninstall / backup / import آماده‌اند."

# ── نصب وابستگی‌ها ───────────────────────────────────────────────────────────
info "نصب وابستگی‌های Node.js..."
NODE_ENV=development npm install --include=dev --legacy-peer-deps --foreground-scripts
success "وابستگی‌ها نصب شدند."

# ── دانلود Chromium ───────────────────────────────────────────────────────────
info "دانلود Chromium برای Puppeteer..."
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false npx puppeteer browsers install chrome 2>/dev/null || \
  node -e "const p=require('puppeteer');p.executablePath&&console.log('ok')" 2>/dev/null || \
  warn "دانلود Chromium ناموفق — ممکن است هنگام اجرا دانلود شود."
success "Chromium آماده است."

# ── تست Puppeteer ─────────────────────────────────────────────────────────────
info "تست Puppeteer + دسترسی به my.telegram.org..."
node --input-type=module << 'JSEOF' 2>/dev/null && success "Puppeteer: ✓ my.telegram.org قابل دسترس است." || warn "Puppeteer test ناموفق — ممکن است after build درست شود."
import puppeteer from './node_modules/puppeteer/lib/esm/puppeteer/node/index.js';
const b = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] });
const p = await b.newPage();
try {
  const r = await p.goto('https://my.telegram.org/auth', { waitUntil: 'domcontentloaded', timeout: 15000 });
  const status = r ? r.status() : 0;
  console.log('HTTP:', status);
  if (status !== 200) process.exit(1);
} catch(e) { console.error(e.message); process.exit(1); } finally { await b.close(); }
JSEOF

# ── بیلد ─────────────────────────────────────────────────────────────────────
info "بیلد ربات..."
set -a; source "$INSTALL_DIR/.env"; set +a
NODE_ENV=development npm run build
success "بیلد موفق."

# ── راه‌اندازی سرویس ─────────────────────────────────────────────────────────
NODE_BIN="$(command -v node)"

setup_systemd() {
  command -v systemctl &>/dev/null || return 1
  printf '[Unit]\nDescription=Ghoghnoosself Telegram Bot\nAfter=network-online.target postgresql.service\nWants=network-online.target\n\n[Service]\nType=simple\nUser=%s\nWorkingDirectory=%s\nEnvironmentFile=%s/.env\nExecStart=%s --enable-source-maps %s/dist/index.mjs\nRestart=always\nRestartSec=5\nStandardOutput=journal\nStandardError=journal\n\n[Install]\nWantedBy=multi-user.target\n' \
    "$USER" "$INSTALL_DIR" "$INSTALL_DIR" "$NODE_BIN" "$INSTALL_DIR" \
    | sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null
  sudo systemctl daemon-reload
  sudo systemctl enable "$SERVICE_NAME"
  sudo systemctl restart "$SERVICE_NAME"
  sleep 2
  if systemctl is-active --quiet "$SERVICE_NAME"; then return 0; else return 1; fi
}

setup_pm2() {
  command -v pm2 &>/dev/null || npm install -g pm2 >/dev/null 2>&1
  cd "$INSTALL_DIR"
  pm2 delete "$SERVICE_NAME" &>/dev/null || true
  env $(grep -v '^#' "$INSTALL_DIR/.env" | xargs) \
    pm2 start dist/index.mjs --name "$SERVICE_NAME" \
      --node-args="--enable-source-maps" --restart-delay=5000 --max-restarts=0
  pm2 save --force >/dev/null 2>&1
  STARTUP_CMD=$(pm2 startup 2>&1 | grep "sudo" | tail -1)
  [[ -n "$STARTUP_CMD" ]] && eval "$STARTUP_CMD" >/dev/null 2>&1 || true
  return 0
}

info "راه‌اندازی سرویس..."
if setup_systemd 2>/dev/null; then
  success "سرویس systemd فعال و در حال اجراست ✓"
elif setup_pm2 2>/dev/null; then
  success "سرویس pm2 فعال شد ✓"
else
  warn "اجرای دستی: cd $INSTALL_DIR && npm start"
fi

echo ""
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ نصب کامل شد — v2.1 (PostgreSQL)     ${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo ""
echo -e "  📁 مسیر:      ${CYAN}$INSTALL_DIR${NC}"
echo -e "  🔧 تنظیمات:   ${CYAN}$INSTALL_DIR/.env${NC}"
echo ""
echo -e "  📌 دستورات:"
echo -e "     ${YELLOW}update-ghoghnoosself${NC}    — آپدیت به آخرین نسخه"
echo -e "     ${YELLOW}uninstall-ghoghnoosself${NC} — حذف کامل"
echo -e "     ${YELLOW}backup-ghoghnoosself${NC}    — بکاپ از دیتابیس"
echo -e "     ${YELLOW}import-ghoghnoosself <file>${NC} — ایمپورت بکاپ"
echo ""
echo -e "  📋 لاگ‌ها:"
echo -e "     ${YELLOW}journalctl -u ghoghnoosself -f${NC}   — لاگ زنده"
echo -e "     ${YELLOW}journalctl -u ghoghnoosself -n 50${NC} — ۵۰ خط آخر"
echo ""
