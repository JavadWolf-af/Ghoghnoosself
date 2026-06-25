#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="$HOME/Ghoghnoosself"
SERVICE_NAME="ghoghnoosself"
BIN_UPDATE="/usr/local/bin/update-ghoghnoosself"
BIN_UNINSTALL="/usr/local/bin/uninstall-ghoghnoosself"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }

echo ""
echo -e "${RED}══════════════════════════════════════════${NC}"
echo -e "${RED}   ربات سلف — حذف کامل                   ${NC}"
echo -e "${RED}══════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}  این عملیات ربات و تمام فایل‌های آن را حذف می‌کند.${NC}"
echo ""
read -rp "  آیا مطمئنید؟ (y/N): " CONFIRM
[[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]] && echo "  لغو شد." && exit 0
echo ""

if command -v systemctl &>/dev/null && systemctl list-unit-files 2>/dev/null | grep -q "$SERVICE_NAME.service"; then
  info "توقف سرویس systemd..."
  sudo systemctl stop "$SERVICE_NAME" 2>/dev/null || true
  sudo systemctl disable "$SERVICE_NAME" 2>/dev/null || true
  sudo rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
  sudo systemctl daemon-reload
  sudo systemctl reset-failed 2>/dev/null || true
  success "سرویس systemd حذف شد."
fi

if command -v pm2 &>/dev/null && pm2 list 2>/dev/null | grep -q "$SERVICE_NAME"; then
  info "توقف سرویس pm2..."
  pm2 delete "$SERVICE_NAME" 2>/dev/null || true
  pm2 save --force 2>/dev/null || true
  success "سرویس pm2 حذف شد."
fi

[[ -f "$BIN_UPDATE" ]]    && sudo rm -f "$BIN_UPDATE"    && success "دستور update-ghoghnoosself حذف شد."
[[ -f "$BIN_UNINSTALL" ]] && sudo rm -f "$BIN_UNINSTALL"

if [[ -d "$INSTALL_DIR" ]]; then
  info "حذف فایل‌های ربات..."
  rm -rf "$INSTALL_DIR"
  success "پوشه $INSTALL_DIR حذف شد."
fi

echo ""
echo -e "${GREEN}✅ ربات کاملاً حذف شد.${NC}"
echo ""
