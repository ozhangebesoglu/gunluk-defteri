# Multi-stage build için Node.js base image
FROM node:18-alpine AS builder

# Güvenlik: non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S diary -u 1001

# Çalışma dizini
WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Dependencies yükle
RUN npm ci --only=production --no-audit --no-fund
RUN cd frontend && npm ci --only=production --no-audit --no-fund

# Kaynak kodları kopyala
COPY . .

# Frontend build
RUN npm run build:frontend

# Production stage
FROM node:18-alpine AS production

# Güvenlik güncellemeleri
RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Non-root user oluştur
RUN addgroup -g 1001 -S nodejs
RUN adduser -S diary -u 1001

# Çalışma dizini
WORKDIR /app

# Production dependencies'i kopyala
COPY --from=builder --chown=diary:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=diary:nodejs /app/package*.json ./

# Build edilmiş dosyaları kopyala
COPY --from=builder --chown=diary:nodejs /app/frontend/dist ./frontend/dist
COPY --from=builder --chown=diary:nodejs /app/src ./src
COPY --from=builder --chown=diary:nodejs /app/db ./db
COPY --from=builder --chown=diary:nodejs /app/knexfile.js ./

# Güvenlik: dosya izinleri
RUN chown -R diary:nodejs /app
USER diary

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check')" || exit 1

# Port expose
EXPOSE 3000

# Başlangıç komutu
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/main/main.js"] 