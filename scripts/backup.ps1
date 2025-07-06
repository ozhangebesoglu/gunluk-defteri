# PostgreSQL/Supabase otomatik yedekleme PowerShell scripti
# .env veya configten alınan değerlerle çalışır

$BACKUP_DIR = "./backups"
$DATE = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$DB_NAME = $env:SUPABASE_DB_NAME
if (-not $DB_NAME) { $DB_NAME = "gunluk" }

if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

if (-not $env:SUPABASE_DB_HOST -or -not $env:SUPABASE_DB_USER -or -not $env:SUPABASE_DB_PASSWORD) {
    Write-Host "HATA: SUPABASE_DB_HOST, SUPABASE_DB_USER veya SUPABASE_DB_PASSWORD tanımlı değil!"
    exit 1
}

$backupFile = "$BACKUP_DIR/backup_$DATE.dump"
$env:PGPASSWORD = $env:SUPABASE_DB_PASSWORD
pg_dump -h $env:SUPABASE_DB_HOST -U $env:SUPABASE_DB_USER -d $DB_NAME -F c -b -v -f $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Yedekleme başarılı: $backupFile"
} else {
    Write-Host "Yedekleme başarısız!"
    exit 1
} 