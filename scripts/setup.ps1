# Günlük Defteri Uygulaması - Windows Production Setup Script
# Bu script uygulamayı Windows'ta production ortamında çalıştırmak için gerekli tüm adımları yapar

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("1", "2", "3", "4")]
    [string]$SetupType
)

# Hata durumunda dur
$ErrorActionPreference = "Stop"

Write-Host "🚀 Günlük Defteri Uygulaması - Windows Production Setup Başlıyor..." -ForegroundColor Blue

# Yardımcı fonksiyonlar
function Write-Step {
    param([string]$Message)
    Write-Host "📋 $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Gereksinimler kontrolü
function Test-Requirements {
    Write-Step "Gereksinimler kontrol ediliyor..."
    
    # Node.js kontrolü
    try {
        $nodeVersion = node --version
        $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        
        if ($versionNumber -lt 18) {
            Write-Error "Node.js 18+ gerekli. Mevcut sürüm: $nodeVersion"
            exit 1
        }
    }
    catch {
        Write-Error "Node.js bulunamadı. Lütfen Node.js 18+ yükleyin."
        exit 1
    }
    
    # npm kontrolü
    try {
        npm --version | Out-Null
    }
    catch {
        Write-Error "npm bulunamadı."
        exit 1
    }
    
    # Docker kontrolü
    try {
        docker --version | Out-Null
    }
    catch {
        Write-Error "Docker bulunamadı. Lütfen Docker Desktop yükleyin."
        exit 1
    }
    
    # Docker Compose kontrolü
    try {
        docker-compose --version | Out-Null
    }
    catch {
        try {
            docker compose version | Out-Null
        }
        catch {
            Write-Error "Docker Compose bulunamadı."
            exit 1
        }
    }
    
    Write-Success "Tüm gereksinimler karşılandı"
}

# Bağımlılıkları yükle
function Install-Dependencies {
    Write-Step "Ana proje bağımlılıkları yükleniyor..."
    npm install
    Write-Success "Ana proje bağımlılıkları yüklendi"
    
    Write-Step "Frontend bağımlılıkları yükleniyor..."
    Set-Location frontend
    npm install
    Set-Location ..
    Write-Success "Frontend bağımlılıkları yüklendi"
}

# PostgreSQL Docker container'ını başlat
function Start-Database {
    Write-Step "PostgreSQL veritabanı başlatılıyor..."
    
    # Eğer container zaten çalışıyorsa durdur
    $existingContainer = docker ps -q --filter "name=diary_postgres"
    if ($existingContainer) {
        Write-Warning "PostgreSQL container zaten çalışıyor, yeniden başlatılıyor..."
        docker-compose down
    }
    
    # Container'ı başlat
    docker-compose up -d postgres
    
    # Veritabanının hazır olmasını bekle
    Write-Step "Veritabanının hazır olması bekleniyor..."
    $timeout = 60
    $counter = 0
    
    do {
        try {
            docker exec diary_postgres pg_isready -U diary_user -d diary_app 2>$null | Out-Null
            Write-Success "PostgreSQL hazır"
            break
        }
        catch {
            Write-Host "." -NoNewline
            Start-Sleep -Seconds 1
            $counter++
        }
    } while ($counter -lt $timeout)
    
    if ($counter -eq $timeout) {
        Write-Error "PostgreSQL başlatılamadı (timeout)"
        exit 1
    }
}

# Veritabanı migration ve seed
function Setup-Database {
    Write-Step "Veritabanı migration'ları çalıştırılıyor..."
    npm run db:migrate
    Write-Success "Migration'lar tamamlandı"
    
    Write-Step "Demo veriler yükleniyor..."
    npm run db:seed
    Write-Success "Demo veriler yüklendi"
}

# Frontend build
function Build-Frontend {
    Write-Step "Frontend build ediliyor..."
    npm run build:frontend
    Write-Success "Frontend build tamamlandı"
}

# Electron uygulama build
function Build-Electron {
    Write-Step "Electron uygulaması build ediliyor..."
    npm run build:electron
    Write-Success "Electron uygulaması build edildi"
}

# Ana setup fonksiyonu
function Start-Setup {
    if (-not $SetupType) {
        Write-Host "🎯 Kurulum türü seçin:" -ForegroundColor Cyan
        Write-Host "1) Hızlı kurulum (sadece development)"
        Write-Host "2) Tam kurulum (production ready)"
        Write-Host "3) Sadece veritabanı kurulumu"
        Write-Host "4) Sadece build"
        
        $SetupType = Read-Host "Seçiminiz (1-4)"
    }
    
    switch ($SetupType) {
        "1" {
            Write-Step "Hızlı kurulum başlıyor..."
            Test-Requirements
            Install-Dependencies
            Start-Database
            Setup-Database
            Write-Success "Hızlı kurulum tamamlandı! 'npm run dev' ile başlatabilirsiniz."
        }
        "2" {
            Write-Step "Tam kurulum başlıyor..."
            Test-Requirements
            Install-Dependencies
            Start-Database
            Setup-Database
            Build-Frontend
            Build-Electron
            Write-Success "Tam kurulum tamamlandı! dist-electron klasöründe executable dosyalar hazır."
        }
        "3" {
            Write-Step "Sadece veritabanı kurulumu..."
            Test-Requirements
            Start-Database
            Setup-Database
            Write-Success "Veritabanı kurulumu tamamlandı!"
        }
        "4" {
            Write-Step "Sadece build işlemi..."
            Test-Requirements
            Build-Frontend
            Build-Electron
            Write-Success "Build işlemi tamamlandı!"
        }
        default {
            Write-Error "Geçersiz seçim!"
            exit 1
        }
    }
}

# Script'i çalıştır
try {
    Start-Setup
    
    Write-Host ""
    Write-Host "🎉 Kurulum tamamlandı!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Kullanılabilir komutlar:" -ForegroundColor Cyan
    Write-Host "  npm run dev          - Development modda başlat"
    Write-Host "  npm run build        - Production build"
    Write-Host "  npm run db:fresh     - Veritabanını sıfırla ve yeniden kur"
    Write-Host "  npm run db:status    - Migration durumunu kontrol et"
    Write-Host ""
    Write-Host "🔗 Faydalı linkler:" -ForegroundColor Cyan
    Write-Host "  PgAdmin: http://localhost:8080 (admin@diary.local / admin123)"
    Write-Host "  PostgreSQL: localhost:5432 (diary_user / secure_password_123)"
    Write-Host ""
}
catch {
    Write-Error "Kurulum sırasında hata oluştu: $($_.Exception.Message)"
    exit 1
} 