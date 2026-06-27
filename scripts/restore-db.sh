#!/bin/sh
# Restaura un backup generado por backup-db.sh. SOBREESCRIBE la base de datos
# actual: pide confirmación explícita salvo que se pase -y.
#
# Uso:
#   ./scripts/restore-db.sh backups/pollaapp_20260615_030000.sql.gz
#   ./scripts/restore-db.sh backups/pollaapp_20260615_030000.sql.gz -y   # sin confirmar
set -eu

FILE="${1:-}"
SKIP_CONFIRM="${2:-}"

if [ -z "$FILE" ]; then
  echo "Uso: $0 <archivo.sql.gz> [-y]"
  exit 1
fi
if [ ! -f "$FILE" ]; then
  echo "[restore-db] No existe el archivo: $FILE"
  exit 1
fi

PGHOST="${PGHOST:-db}"
POSTGRES_USER="${POSTGRES_USER:-pollaapp}"
POSTGRES_DB="${POSTGRES_DB:-pollaapp}"
export PGPASSWORD="${POSTGRES_PASSWORD:-}"

if [ "$SKIP_CONFIRM" != "-y" ]; then
  echo "Esto SOBREESCRIBE la base de datos '$POSTGRES_DB' en '$PGHOST' con el contenido de $FILE."
  printf "Escribe RESTAURAR para confirmar: "
  read -r CONFIRM
  if [ "$CONFIRM" != "RESTAURAR" ]; then
    echo "[restore-db] Cancelado."
    exit 1
  fi
fi

echo "[restore-db] Restaurando $FILE en $POSTGRES_DB..."
gunzip -c "$FILE" | psql -h "$PGHOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB"
echo "[restore-db] Listo."
