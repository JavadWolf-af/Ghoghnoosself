#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="$HOME/Ghoghnoosself"
SERVICE_NAME="ghoghnoosself"

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
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

info "نصب وابستگی‌ها..."
NODE_ENV=development npm install --include=dev --legacy-peer-deps
success "وابستگی‌ها بررسی شدند."

info "بیلد ربات..."
NODE_ENV=development npm run build
success "بیلد موفق."

info "ری‌استارت سرویس..."
if command -v systemctl &>/dev/null && systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
  sudo systemctl restart "$SERVICE_NAME"
  success "سرویس ری‌استارت شد."
elif command -v pm2 &>/dev/null && pm2 list 2>/dev/null | grep -q "$SERVICE_NAME"; then
  pm2 restart "$SERVICE_NAME"
  success "سرویس pm2 ری‌استارت شد."
else
  info "اجرای دستی: cd $INSTALL_DIR && npm start"
fi

echo ""
echo -e "${GREEN}✅ آپدیت با موفقیت انجام شد!${NC}"
echo ""
