#!/bin/sh
# Backup diario de Postgres. Lo ejecuta el servicio "backup" del
# docker-compose.yml de producción (vía cron dentro del container), o se
# puede correr manualmente: ./scripts/backup-db.sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
PGHOST="${PGHOST:-db}"
POSTGRES_USER="${POSTGRES_USER:-pollaapp}"
POSTGRES_DB="${POSTGRES_DB:-pollaapp}"
export PGPASSWORD="${POSTGRES_PASSWORD:-}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/pollaapp_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[backup-db] Volcando $POSTGRES_DB desde $PGHOST a $FILE..."
pg_dump -h "$PGHOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl | gzip > "$FILE"
echo "[backup-db] Listo: $(du -h "$FILE" | cut -f1)"

echo "[backup-db] Eliminando backups con más de $RETENTION_DAYS días..."
find "$BACKUP_DIR" -name "pollaapp_*.sql.gz" -mtime "+$RETENTION_DAYS" -delete

echo "[backup-db] Backups actuales:"
ls -lh "$BACKUP_DIR" | grep pollaapp_ || echo "(ninguno)"
