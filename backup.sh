#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="$HOME/Ghoghnoosself"
BACKUP_DIR="${BACKUP_DIR:-$HOME}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

echo ""
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo -e "${CYAN}   ربات سلف — بکاپ دیتابیس               ${NC}"
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo ""

[[ ! -f "$INSTALL_DIR/.env" ]] && error "فایل .env یافت نشد. مطمئن شوید ربات نصب شده."

set -a
source "$INSTALL_DIR/.env"
set +a

[[ -z "${DATABASE_URL:-}" ]] && error "DATABASE_URL در .env یافت نشد."

if ! command -v pg_dump &>/dev/null; then
  error "pg_dump یافت نشد. مطمئن شوید PostgreSQL نصب است."
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ghoghnoosself_backup_${TIMESTAMP}.sql.gz"

info "در حال تهیه بکاپ از دیتابیس..."
pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  | gzip > "$BACKUP_FILE"

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo ""
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ بکاپ با موفقیت گرفته شد             ${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo ""
echo -e "  📦 فایل: ${CYAN}$BACKUP_FILE${NC}"
echo -e "  📏 حجم:  ${CYAN}$SIZE${NC}"
echo ""
echo -e "  برای انتقال به سرور جدید:"
echo -e "  ${YELLOW}scp $BACKUP_FILE user@new-server:~/${NC}"
echo ""
echo -e "  برای ایمپورت در سرور جدید:"
echo -e "  ${YELLOW}import-ghoghnoosself $(basename "$BACKUP_FILE")${NC}"
echo ""
