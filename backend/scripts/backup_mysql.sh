#!/usr/bin/env bash
# ==============================================================================
# CareerBridge Production MySQL Automated Backup Script
# Performs a non-blocking online snapshot with compression and daily rotation
# Usage:
#   chmod +x backup_mysql.sh
#   ./backup_mysql.sh
# Cron configuration (Daily at 02:00 AM):
#   0 2 * * * /app/scripts/backup_mysql.sh >> /var/log/careerbridge_backup.log 2>&1
# ==============================================================================

set -euo pipefail

# Configuration (defaults can be overridden via environment variables)
DB_HOST="${MYSQL_HOST:-localhost}"
DB_PORT="${MYSQL_PORT:-3306}"
DB_NAME="${MYSQL_DATABASE:-careerbridge_prod}"
DB_USER="${MYSQL_USER:-cb_app_user}"
DB_PASSWORD="${MYSQL_PASSWORD:-}"
BACKUP_DIR="${BACKUP_STORAGE_DIR:-/var/backups/careerbridge}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

DATE_STAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${DATE_STAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting online backup of ${DB_NAME} from ${DB_HOST}:${DB_PORT}..."

# Execute online non-blocking dump using mysqldump
# --single-transaction: Uses InnoDB repeatable read snapshot (zero table lock)
# --quick: Streams rows directly without buffering huge result sets in RAM
# --routines --triggers --events: Preserves stored procedures and database triggers
mysqldump \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --user="${DB_USER}" \
  --password="${DB_PASSWORD}" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --default-character-set=utf8mb4 \
  "${DB_NAME}" | gzip -9 > "${BACKUP_FILE}"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Backup completed successfully: ${BACKUP_FILE} (Size: ${FILE_SIZE})"

# Retention Management: Purge backups older than RETENTION_DAYS
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "${DB_NAME}_backup_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -exec rm -f {} \;
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Backup retention cleanup complete."

