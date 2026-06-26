#!/usr/bin/env bash
set -euo pipefail

# اطمینان از اینکه در یک مسیر معتبر هستیم — حتی اگر از داخل پوشه حذف‌شدنی اجرا شود
cd "$HOME" 2>/dev/null || cd /tmp

REPO="https://github.com/JavadWolf-af/Ghoghnoosself"
INSTALL_DIR="$HOME/Ghoghnoosself"
SERVICE_NAME="ghoghnoosself"
NODE_MIN_VERSION=18
BIN_UPDATE="/usr/local/bin/update-ghoghnoosself"
BIN_UNINSTALL="/usr/local/bin/uninstall-ghoghnoosself"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

echo ""
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo -e "${CYAN}   ربات تلگرام سلف — نصب خودکار v1.1     ${NC}"
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo ""

OS="$(uname -s)"
[[ "$OS" != "Linux" && "$OS" != "Darwin" ]] && error "Only Linux/macOS supported."

install_package() {
  local pkg="$1"
  if command -v apt-get &>/dev/null; then sudo apt-get install -y "$pkg" >/dev/null
  elif command -v yum &>/dev/null; then sudo yum install -y "$pkg" >/dev/null
  elif command -v dnf &>/dev/null; then sudo dnf install -y "$pkg" >/dev/null
  elif command -v brew &>/dev/null; then brew install "$pkg" >/dev/null
  else error "Cannot install $pkg automatically. Please install manually."; fi
}

info "بررسی پیش‌نیازها..."
if ! command -v git &>/dev/null; then info "Installing Git..."; install_package git; fi
success "Git: $(git --version)"

if ! command -v node &>/dev/null; then
  info "Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - >/dev/null
  install_package nodejs
fi

NODE_VER=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
[[ "$NODE_VER" -lt "$NODE_MIN_VERSION" ]] && error "Node.js >= $NODE_MIN_VERSION required. Current: $NODE_VER"
success "Node.js: $(node --version)"

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

if [[ ! -f "$INSTALL_DIR/.env" ]]; then
  cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"
  echo ""
  warn "اطلاعات ربات را وارد کنید:"
  echo ""
  read -rp "  Bot token (from @BotFather): " BOT_TOKEN
  read -rp "  Channel username (e.g. @MyChannel): " CH_USER
  read -rp "  Channel URL (e.g. https://t.me/MyChannel): " CH_URL
  read -rp "  Admin ID (numeric Telegram ID): " ADM_IDS
  sed -i.bak \
    -e "s|1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ|${BOT_TOKEN}|" \
    -e "s|CHANNEL_USERNAME=@YourChannel|CHANNEL_USERNAME=${CH_USER}|" \
    -e "s|CHANNEL_URL=https://t.me/YourChannel|CHANNEL_URL=${CH_URL}|" \
    -e "s|ADMIN_IDS=123456789,987654321|ADMIN_IDS=${ADM_IDS}|" \
    "$INSTALL_DIR/.env"
  rm -f "$INSTALL_DIR/.env.bak"
  success "فایل .env پر شد."
else
  success "فایل .env از قبل موجود است."
fi

info "ساخت دستورات update/uninstall..."
printf '#!/usr/bin/env bash\nbash "%s/update.sh"\n' "$INSTALL_DIR" | sudo tee "$BIN_UPDATE" > /dev/null
sudo chmod +x "$BIN_UPDATE"
printf '#!/usr/bin/env bash\nbash "%s/uninstall.sh"\n' "$INSTALL_DIR" | sudo tee "$BIN_UNINSTALL" > /dev/null
sudo chmod +x "$BIN_UNINSTALL"
success "update-ghoghnoosself و uninstall-ghoghnoosself آماده‌اند."

info "نصب وابستگی‌ها..."
NODE_ENV=development npm install --include=dev --legacy-peer-deps
success "وابستگی‌ها نصب شدند."

info "بیلد ربات..."
NODE_ENV=development npm run build
success "بیلد موفق."

NODE_BIN="$(command -v node)"

setup_systemd() {
  command -v systemctl &>/dev/null || return 1
  printf '[Unit]\nDescription=Ghoghnoosself Telegram Bot\nAfter=network-online.target\nWants=network-online.target\n\n[Service]\nType=simple\nUser=%s\nWorkingDirectory=%s\nEnvironmentFile=%s/.env\nExecStart=%s --enable-source-maps %s/dist/index.mjs\nRestart=always\nRestartSec=5\nStartLimitIntervalSec=0\nStandardOutput=journal\nStandardError=journal\n\n[Install]\nWantedBy=multi-user.target\n' \
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
echo -e "${GREEN}   ✅ نصب کامل شد — v1.1                  ${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo ""
echo -e "  📁 مسیر: ${CYAN}$INSTALL_DIR${NC}"
echo -e "  🔧 تنظیمات: ${CYAN}$INSTALL_DIR/.env${NC}"
echo ""
echo -e "  📌 دستورات:"
echo -e "     ${YELLOW}update-ghoghnoosself${NC}    — آپدیت"
echo -e "     ${YELLOW}uninstall-ghoghnoosself${NC} — حذف کامل"
echo ""
