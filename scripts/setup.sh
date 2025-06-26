#!/bin/bash

# Günlük Defteri Uygulaması - Production Setup Script
# Bu script uygulamayı production ortamında çalıştırmak için gerekli tüm adımları yapar

set -e

echo "🚀 Günlük Defteri Uygulaması - Production Setup Başlıyor..."

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Yardımcı fonksiyonlar
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Gereksinimler kontrolü
check_requirements() {
    print_step "Gereksinimler kontrol ediliyor..."
    
    # Node.js kontrolü
    if ! command -v node &> /dev/null; then
        print_error "Node.js bulunamadı. Lütfen Node.js 18+ yükleyin."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js 18+ gerekli. Mevcut sürüm: $(node -v)"
        exit 1
    fi
    
    # npm kontrolü
    if ! command -v npm &> /dev/null; then
        print_error "npm bulunamadı."
        exit 1
    fi
    
    # Docker kontrolü
    if ! command -v docker &> /dev/null; then
        print_error "Docker bulunamadı. Lütfen Docker yükleyin."
        exit 1
    fi
    
    # Docker Compose kontrolü
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose bulunamadı."
        exit 1
    fi
    
    print_success "Tüm gereksinimler karşılandı"
}

# Bağımlılıkları yükle
install_dependencies() {
    print_step "Ana proje bağımlılıkları yükleniyor..."
    npm install
    print_success "Ana proje bağımlılıkları yüklendi"
    
    print_step "Frontend bağımlılıkları yükleniyor..."
    cd frontend
    npm install
    cd ..
    print_success "Frontend bağımlılıkları yüklendi"
}

# PostgreSQL Docker container'ını başlat
start_database() {
    print_step "PostgreSQL veritabanı başlatılıyor..."
    
    # Eğer container zaten çalışıyorsa durdur
    if docker ps -q --filter "name=diary_postgres" | grep -q .; then
        print_warning "PostgreSQL container zaten çalışıyor, yeniden başlatılıyor..."
        docker-compose down
    fi
    
    # Container'ı başlat
    docker-compose up -d postgres
    
    # Veritabanının hazır olmasını bekle
    print_step "Veritabanının hazır olması bekleniyor..."
    timeout=60
    counter=0
    
    while [ $counter -lt $timeout ]; do
        if docker exec diary_postgres pg_isready -U diary_user -d diary_app &> /dev/null; then
            print_success "PostgreSQL hazır"
            break
        fi
        
        echo -n "."
        sleep 1
        counter=$((counter + 1))
    done
    
    if [ $counter -eq $timeout ]; then
        print_error "PostgreSQL başlatılamadı (timeout)"
        exit 1
    fi
}

# Veritabanı migration ve seed
setup_database() {
    print_step "Veritabanı migration'ları çalıştırılıyor..."
    npm run db:migrate
    print_success "Migration'lar tamamlandı"
    
    print_step "Demo veriler yükleniyor..."
    npm run db:seed
    print_success "Demo veriler yüklendi"
}

# Frontend build
build_frontend() {
    print_step "Frontend build ediliyor..."
    npm run build:frontend
    print_success "Frontend build tamamlandı"
}

# Electron uygulama build
build_electron() {
    print_step "Electron uygulaması build ediliyor..."
    npm run build:electron
    print_success "Electron uygulaması build edildi"
}

# Ana setup fonksiyonu
main() {
    echo "🎯 Kurulum türü seçin:"
    echo "1) Hızlı kurulum (sadece development)"
    echo "2) Tam kurulum (production ready)"
    echo "3) Sadece veritabanı kurulumu"
    echo "4) Sadece build"
    
    read -p "Seçiminiz (1-4): " choice
    
    case $choice in
        1)
            print_step "Hızlı kurulum başlıyor..."
            check_requirements
            install_dependencies
            start_database
            setup_database
            print_success "Hızlı kurulum tamamlandı! 'npm run dev' ile başlatabilirsiniz."
            ;;
        2)
            print_step "Tam kurulum başlıyor..."
            check_requirements
            install_dependencies
            start_database
            setup_database
            build_frontend
            build_electron
            print_success "Tam kurulum tamamlandı! dist-electron klasöründe executable dosyalar hazır."
            ;;
        3)
            print_step "Sadece veritabanı kurulumu..."
            check_requirements
            start_database
            setup_database
            print_success "Veritabanı kurulumu tamamlandı!"
            ;;
        4)
            print_step "Sadece build işlemi..."
            check_requirements
            build_frontend
            build_electron
            print_success "Build işlemi tamamlandı!"
            ;;
        *)
            print_error "Geçersiz seçim!"
            exit 1
            ;;
    esac
}

# Script'i çalıştır
main "$@"

echo ""
echo "🎉 Kurulum tamamlandı!"
echo ""
echo "📋 Kullanılabilir komutlar:"
echo "  npm run dev          - Development modda başlat"
echo "  npm run build        - Production build"
echo "  npm run db:fresh     - Veritabanını sıfırla ve yeniden kur"
echo "  npm run db:status    - Migration durumunu kontrol et"
echo ""
echo "🔗 Faydalı linkler:"
echo "  PgAdmin: http://localhost:8080 (admin@diary.local / admin123)"
echo "  PostgreSQL: localhost:5432 (diary_user / secure_password_123)"
echo "" 