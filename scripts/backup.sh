#!/bin/bash
# PostgreSQL/Supabase otomatik yedekleme scripti
# .env veya configten alınan değerlerle çalışır

set -e

BACKUP_DIR="./backups"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
DB_URL=${SUPABASE_DB_URL:-$DATABASE_URL}
DB_NAME=${SUPABASE_DB_NAME:-gunluk}

mkdir -p "$BACKUP_DIR"

if [ -z "$DB_URL" ]; then
  echo "HATA: SUPABASE_DB_URL veya DATABASE_URL tanımlı değil!"
  exit 1
fi

# PostgreSQL dump
PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump -h "$SUPABASE_DB_HOST" -U "$SUPABASE_DB_USER" -d "$DB_NAME" -F c -b -v -f "$BACKUP_DIR/backup_$DATE.dump"

if [ $? -eq 0 ]; then
  echo "Yedekleme başarılı: $BACKUP_DIR/backup_$DATE.dump"
else
  echo "Yedekleme başarısız!"
  exit 1
fi 