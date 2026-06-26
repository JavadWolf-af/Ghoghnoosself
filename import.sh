#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="$HOME/Ghoghnoosself"
SERVICE_NAME="ghoghnoosself"
BACKUP_FILE="${1:-}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

echo ""
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo -e "${CYAN}   ربات سلف — ایمپورت دیتابیس             ${NC}"
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo ""

# ── بررسی آرگومان ──────────────────────────────────────────────────────────────
if [[ -z "$BACKUP_FILE" ]]; then
  echo -e "  نحوه استفاده: ${YELLOW}import-ghoghnoosself <backup_file.sql.gz>${NC}"
  echo ""
  echo -e "  مثال:"
  echo -e "  ${YELLOW}import-ghoghnoosself ~/ghoghnoosself_backup_20260101_120000.sql.gz${NC}"
  echo ""
  # نمایش بکاپ‌های موجود
  FOUND=$(ls "$HOME"/ghoghnoosself_backup_*.sql.gz 2>/dev/null || true)
  if [[ -n "$FOUND" ]]; then
    echo -e "  بکاپ‌های موجود در $HOME:"
    for f in $FOUND; do
      SIZE=$(du -h "$f" | cut -f1)
      echo -e "    ${CYAN}$(basename "$f")${NC}  ($SIZE)"
    done
    echo ""
  fi
  exit 1
fi

[[ ! -f "$BACKUP_FILE" ]] && error "فایل بکاپ یافت نشد: $BACKUP_FILE"
[[ ! -f "$INSTALL_DIR/.env" ]] && error "فایل .env یافت نشد. ابتدا ربات را نصب کنید."

set -a
source "$INSTALL_DIR/.env"
set +a

[[ -z "${DATABASE_URL:-}" ]] && error "DATABASE_URL در .env یافت نشد."

if ! command -v psql &>/dev/null; then
  error "psql یافت نشد. مطمئن شوید PostgreSQL نصب است."
fi

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "  📦 فایل: ${CYAN}$BACKUP_FILE${NC}"
echo -e "  📏 حجم:  ${CYAN}$SIZE${NC}"
echo ""
warn "این عملیات تمام داده‌های فعلی دیتابیس را با داده‌های بکاپ جایگزین می‌کند."
read -rp "  ادامه می‌دهید؟ (y/N): " CONFIRM
[[ "${CONFIRM,,}" != "y" ]] && { info "عملیات لغو شد."; exit 0; }

echo ""

# ── توقف سرویس ─────────────────────────────────────────────────────────────────
info "توقف سرویس ربات..."
if command -v systemctl &>/dev/null && systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
  sudo systemctl stop "$SERVICE_NAME"
  success "سرویس systemd متوقف شد."
elif command -v pm2 &>/dev/null && pm2 list 2>/dev/null | grep -q "$SERVICE_NAME"; then
  pm2 stop "$SERVICE_NAME" 2>/dev/null || true
  success "سرویس pm2 متوقف شد."
else
  warn "سرویس در حال اجرا نبود."
fi

# ── ایمپورت دیتابیس ────────────────────────────────────────────────────────────
info "در حال ایمپورت دیتابیس..."

if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL" -q
else
  psql "$DATABASE_URL" -q < "$BACKUP_FILE"
fi

success "دیتابیس با موفقیت ایمپورت شد."

# ── راه‌اندازی مجدد سرویس ──────────────────────────────────────────────────────
info "راه‌اندازی مجدد سرویس..."
if command -v systemctl &>/dev/null && systemctl list-unit-files "${SERVICE_NAME}.service" &>/dev/null; then
  sudo systemctl start "$SERVICE_NAME"
  sleep 2
  if systemctl is-active --quiet "$SERVICE_NAME"; then
    success "سرویس systemd راه‌اندازی شد."
  else
    warn "سرویس راه‌اندازی نشد. لاگ: journalctl -u $SERVICE_NAME -n 20"
  fi
elif command -v pm2 &>/dev/null && pm2 list 2>/dev/null | grep -q "$SERVICE_NAME"; then
  pm2 start "$SERVICE_NAME" 2>/dev/null || true
  success "سرویس pm2 راه‌اندازی شد."
else
  warn "اجرای دستی: cd $INSTALL_DIR && npm start"
fi

echo ""
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ ایمپورت با موفقیت انجام شد          ${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo ""
echo -e "  تمام کاربران، موجودی‌ها، توکن‌ها و تیکت‌ها منتقل شدند."
echo ""
