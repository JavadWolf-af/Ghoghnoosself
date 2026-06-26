#!/usr/bin/env bash
set -euo pipefail

cd "$HOME" 2>/dev/null || cd /tmp

REPO="https://github.com/JavadWolf-af/Ghoghnoosself"
INSTALL_DIR="$HOME/Ghoghnoosself"
SERVICE_NAME="ghoghnoosself"
NODE_MIN_VERSION=18
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
echo -e "${CYAN}   ربات تلگرام سلف — نصب خودکار v2.0     ${NC}"
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
  else error "Cannot install $pkg automatically. Please install manually."; fi
}

# ── Git ───────────────────────────────────────────────────────────────────────
info "بررسی Git..."
if ! command -v git &>/dev/null; then info "نصب Git..."; install_package git; fi
success "Git: $(git --version)"

# ── Node.js ───────────────────────────────────────────────────────────────────
info "بررسی Node.js..."
if ! command -v node &>/dev/null; then
  info "نصب Node.js..."
  if command -v apt-get &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - >/dev/null 2>&1
    install_package nodejs
  elif command -v brew &>/dev/null; then
    brew install node >/dev/null 2>&1
  else
    error "Node.js not found. Please install Node.js >= $NODE_MIN_VERSION manually from https://nodejs.org"
  fi
fi
NODE_VER=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
[[ "$NODE_VER" -lt "$NODE_MIN_VERSION" ]] && error "Node.js >= $NODE_MIN_VERSION required. Current: $NODE_VER"
success "Node.js: $(node --version)"

# ── PostgreSQL ────────────────────────────────────────────────────────────────
info "بررسی PostgreSQL..."
if ! command -v psql &>/dev/null; then
  info "نصب PostgreSQL..."
  if command -v apt-get &>/dev/null; then
    sudo apt-get install -y postgresql postgresql-contrib >/dev/null 2>&1
    sudo systemctl enable postgresql >/dev/null 2>&1 || true
    sudo systemctl start  postgresql >/dev/null 2>&1 || true
  elif command -v brew &>/dev/null; then
    brew install postgresql@16 >/dev/null 2>&1
    brew services start postgresql@16 >/dev/null 2>&1 || true
  else
    error "PostgreSQL not found. Please install it manually."
  fi
fi
success "PostgreSQL: $(psql --version)"

# ── اطمینان از اجرای PostgreSQL ──────────────────────────────────────────────
if command -v systemctl &>/dev/null && ! systemctl is-active --quiet postgresql 2>/dev/null; then
  info "راه‌اندازی PostgreSQL..."
  sudo systemctl start postgresql >/dev/null 2>&1 || true
fi

# ── دانلود ربات ───────────────────────────────────────────────────────────────
if [[ -d "$INSTALL_DIR" ]]; then
  warn "پوشه قبلی حذف می‌شود..."
  [[ -f "$INSTALL_DIR/.env" ]] && cp "$INSTALL_DIR/.env" /tmp/.env_ghoghnoos_bak
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

# ── تنظیم PostgreSQL و ساخت DB ───────────────────────────────────────────────
if [[ ! -f "$INSTALL_DIR/.env" ]]; then
  info "ساخت کاربر و پایگاه داده PostgreSQL..."

  DB_PASS=$(openssl rand -base64 16 | tr -d '/+=\n' | head -c 20)

  # ساخت کاربر و دیتابیس
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || \
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';"
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true

  success "دیتابیس ساخته شد: $DB_NAME"

  DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"

  cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"

  echo ""
  warn "اطلاعات ربات را وارد کنید:"
  echo ""
  read -rp "  Bot token (از @BotFather): " BOT_TOKEN
  read -rp "  Channel username (مثلاً @MyChannel): " CH_USER
  read -rp "  Channel URL (مثلاً https://t.me/MyChannel): " CH_URL
  read -rp "  Admin Telegram ID (عدد): " ADM_IDS

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
  # اگر DATABASE_URL در .env نباشد، آن را اضافه کن
  if ! grep -q "DATABASE_URL" "$INSTALL_DIR/.env"; then
    warn "DATABASE_URL در .env یافت نشد. لطفاً آن را اضافه کنید:"
    read -rp "  DATABASE_URL (مثلاً postgresql://user:pass@localhost:5432/db): " DB_URL_INPUT
    echo "DATABASE_URL=${DB_URL_INPUT}" >> "$INSTALL_DIR/.env"
  fi
fi

# ── ساخت دستورات update/uninstall ────────────────────────────────────────────
info "ساخت دستورات update/uninstall..."
printf '#!/usr/bin/env bash\nbash "%s/update.sh"\n' "$INSTALL_DIR" | sudo tee "$BIN_UPDATE"    > /dev/null
printf '#!/usr/bin/env bash\nbash "%s/uninstall.sh"\n' "$INSTALL_DIR" | sudo tee "$BIN_UNINSTALL" > /dev/null
sudo chmod +x "$BIN_UPDATE" "$BIN_UNINSTALL"
printf '#!/usr/bin/env bash\nbash "%s/backup.sh"\n' "$INSTALL_DIR" | sudo tee "$BIN_BACKUP" > /dev/null
printf '#!/usr/bin/env bash\nbash "%s/import.sh" "$@"\n' "$INSTALL_DIR" | sudo tee "$BIN_IMPORT" > /dev/null
sudo chmod +x "$BIN_BACKUP" "$BIN_IMPORT"
success "update-ghoghnoosself و uninstall-ghoghnoosself و backup-ghoghnoosself و import-ghoghnoosself آماده‌اند."

# ── نصب وابستگی‌ها ───────────────────────────────────────────────────────────
info "نصب وابستگی‌ها..."
NODE_ENV=development npm install --include=dev --legacy-peer-deps
success "وابستگی‌ها نصب شدند."

# ── بیلد ─────────────────────────────────────────────────────────────────────
info "بیلد ربات..."
set -a; source "$INSTALL_DIR/.env"; set +a
NODE_ENV=development npm run build
success "بیلد موفق."

# ── جداول پایگاه داده (به‌صورت خودکار هنگام اولین راه‌اندازی ساخته می‌شوند) ─
success "جداول دیتابیس هنگام اولین اجرا به‌صورت خودکار ساخته می‌شوند."

NODE_BIN="$(command -v node)"

setup_systemd() {
  command -v systemctl &>/dev/null || return 1
  printf '[Unit]\nDescription=Ghoghnoosself Telegram Bot\nAfter=network-online.target postgresql.service\nWants=network-online.target\n\n[Service]\nType=simple\nUser=%s\nWorkingDirectory=%s\nEnvironmentFile=%s/.env\nExecStart=%s --enable-source-maps %s/dist/index.mjs\nRestart=always\nRestartSec=5\nStandardOutput=journal\nStandardError=journal\n\n[Install]\nWantedBy=multi-user.target\n' \
    "$USER" "$INSTALL_DIR" "$INSTALL_DIR" "$NODE_BIN" "$INSTALL_DIR" \
    | sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null
  sudo systemctl daemon-reload
  sudo systemctl enable "$SERVICE_NAME"
  sudo systemctl restart "$SERVICE_NAME"
  return 0
}

setup_pm2() {
  command -v pm2 &>/dev/null || npm install -g pm2
  cd "$INSTALL_DIR"
  pm2 delete "$SERVICE_NAME" &>/dev/null || true
  env $(grep -v '^#' "$INSTALL_DIR/.env" | xargs) \
    pm2 start dist/index.mjs --name "$SERVICE_NAME" \
      --node-args="--enable-source-maps" --restart-delay=5000 --max-restarts=0
  pm2 save --force
  STARTUP_CMD=$(pm2 startup 2>&1 | grep "sudo" | tail -1)
  [[ -n "$STARTUP_CMD" ]] && eval "$STARTUP_CMD" &>/dev/null || true
}

info "راه‌اندازی سرویس..."
if setup_systemd 2>/dev/null; then
  success "سرویس systemd فعال شد."
elif setup_pm2 2>/dev/null; then
  success "سرویس pm2 فعال شد."
else
  warn "اجرای دستی: cd $INSTALL_DIR && npm start"
fi

echo ""
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ نصب کامل شد — v2.0 (PostgreSQL)     ${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo ""
echo -e "  📁 مسیر: ${CYAN}$INSTALL_DIR${NC}"
echo -e "  🔧 تنظیمات: ${CYAN}$INSTALL_DIR/.env${NC}"
echo ""
echo -e "  📌 دستورات:"
echo -e "     ${YELLOW}update-ghoghnoosself${NC}    — آپدیت"
echo -e "     ${YELLOW}uninstall-ghoghnoosself${NC} — حذف کامل
     ${YELLOW}backup-ghoghnoosself${NC}    — بکاپ از دیتابیس
     ${YELLOW}import-ghoghnoosself <file>${NC} — ایمپورت دیتابیس"
echo ""
echo -e "  🗄️  دیتابیس:"
echo -e "     ${YELLOW}journalctl -u ghoghnoosself -f${NC}  — لاگ‌های ربات"
echo -e "     ${YELLOW}psql -U $DB_USER -d $DB_NAME${NC}     — اتصال مستقیم به DB"
echo ""
