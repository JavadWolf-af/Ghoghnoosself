#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="$HOME/Ghoghnoosself"
SERVICE_NAME="ghoghnoosself"
DB_NAME="ghoghnoosself"
DB_USER="ghoghnoosself"

RED="[0;31m"; GREEN="[0;32m"; YELLOW="[1;33m"; CYAN="[0;36m"; NC="[0m"
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

echo ""
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo -e "${CYAN}   ربات سلف — آپدیت                      ${NC}"
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo ""

[[ ! -d "$INSTALL_DIR" ]] && error "ربات نصب نشده. ابتدا install.sh را اجرا کنید."

cd "$INSTALL_DIR"

info "دریافت آخرین نسخه از GitHub..."
git fetch origin main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [[ "$LOCAL" == "$REMOTE" ]]; then
  success "ربات از قبل به‌روز است."
else
  git reset --hard origin/main
  success "کد آپدیت شد."
fi

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
    error "PostgreSQL یافت نشد. لطفاً دستی نصب کنید."
  fi
  success "PostgreSQL نصب شد."
fi

if command -v systemctl &>/dev/null && ! systemctl is-active --quiet postgresql 2>/dev/null; then
  sudo systemctl start postgresql >/dev/null 2>&1 || true
fi

# ── وابستگی‌های سیستمی Puppeteer ─────────────────────────────────────────
info "بررسی وابستگی‌های سیستمی Puppeteer (Chrome headless)..."
if command -v apt-get &>/dev/null; then
  MISSING_PKGS=""
  for pkg in libnss3 libgbm1 libatk-bridge2.0-0 libgtk-3-0 libxss1 libasound2; do
    dpkg -s "$pkg" &>/dev/null || MISSING_PKGS="$MISSING_PKGS $pkg"
  done
  if [[ -n "$MISSING_PKGS" ]]; then
    info "نصب وابستگی‌های Puppeteer:$MISSING_PKGS"
    sudo apt-get update -qq >/dev/null 2>&1 || true
    sudo apt-get install -y \
      ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
      libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
      libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
      libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
      libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
      lsb-release wget xdg-utils >/dev/null 2>&1
    success "وابستگی‌های Puppeteer نصب شدند."
  else
    success "وابستگی‌های Puppeteer از قبل موجودند."
  fi
elif command -v yum &>/dev/null || command -v dnf &>/dev/null; then
  PKG_MGR="yum"; command -v dnf &>/dev/null && PKG_MGR="dnf"
  sudo $PKG_MGR install -y \
    alsa-lib atk cups-libs dbus-libs expat fontconfig libgbm gtk3 \
    libX11 libXcomposite libXcursor libXdamage libXext libXfixes libXi \
    libXrandr libXrender libXtst nss pango xdg-utils >/dev/null 2>&1 || true
  success "وابستگی‌های Puppeteer بررسی شدند."
fi

if [[ -f "$INSTALL_DIR/.env" ]] && ! grep -q "DATABASE_URL" "$INSTALL_DIR/.env"; then
  warn "DATABASE_URL در .env یافت نشد — در حال ساخت دیتابیس..."
  DB_PASS=$(openssl rand -base64 16 | tr -d "/+=\n" | head -c 20)
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD ''$DB_PASS''" 2>/dev/null || \
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD ''$DB_PASS''" 2>/dev/null || true
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
  DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
  echo "DATABASE_URL=${DATABASE_URL}" >> "$INSTALL_DIR/.env"
  success "دیتابیس ساخته شد و DATABASE_URL به .env اضافه شد."
fi

if [[ -f "$INSTALL_DIR/data/db.json" ]]; then
  BACKUP_FILE="$HOME/db_backup_$(date +%Y%m%d_%H%M%S).json"
  cp "$INSTALL_DIR/data/db.json" "$BACKUP_FILE"
  warn "داده‌های قدیمی JSON بکاپ گرفته شد: $BACKUP_FILE"
fi

info "پاک‌سازی node_modules برای جلوگیری از تداخل نسخه‌ها..."
rm -rf node_modules package-lock.json 2>/dev/null || true
success "node_modules پاک شد."

info "نصب وابستگی‌ها..."
NODE_ENV=development npm install --include=dev --legacy-peer-deps --foreground-scripts
success "وابستگی‌ها بررسی شدند."

info "نصب Chromium برای Puppeteer..."
node -e "require('puppeteer')" 2>/dev/null &&   node -e "const p=require('puppeteer');p.executablePath&&console.log('Chromium OK')" 2>/dev/null ||   npx puppeteer browsers install chrome 2>/dev/null || true
success "Puppeteer آماده است."

info "بیلد ربات..."
set -a; source "$INSTALL_DIR/.env"; set +a
NODE_ENV=development npm run build
success "بیلد موفق."

info "ری‌استارت سرویس..."
if command -v systemctl &>/dev/null && systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
  sudo systemctl restart "$SERVICE_NAME"
  success "سرویس systemd ری‌استارت شد."
elif command -v pm2 &>/dev/null && pm2 list 2>/dev/null | grep -q "$SERVICE_NAME"; then
  pm2 restart "$SERVICE_NAME"
  success "سرویس pm2 ری‌استارت شد."
else
  warn "اجرای دستی: cd $INSTALL_DIR && npm start"
fi

echo ""
echo -e "${GREEN}✅ آپدیت با موفقیت انجام شد! (v2 — PostgreSQL)${NC}"
echo ""


