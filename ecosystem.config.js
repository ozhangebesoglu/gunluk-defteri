module.exports = {
  apps: [
    {
      name: 'gunce-defteri-app',
      script: './backend/server.js',
      instances: 'max', // Mümkün olan en fazla instance'ı çalıştır (CPU sayısına göre)
      exec_mode: 'cluster', // Cluster modunda çalıştırarak yükü dağıt
      watch: false, // Production'da dosya izlemeyi kapat, değişiklikler için yeniden deploy edilmeli
      max_memory_restart: '250M', // Bellek kullanımı 250MB'ı geçerse yeniden başlat
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        // Production için PORT gibi diğer ortam değişkenleri burada veya 
        // sunucudaki .env dosyasında tanımlanabilir.
        // PORT: 8080 
      },
      log_date_format: 'YYYY-MM-DD HH:mm Z', // Loglara tarih formatı ekle
      error_file: './logs/pm2-error.log', // Hata loglarının yazılacağı dosya
      out_file: './logs/pm2-out.log', // Genel logların yazılacağı dosya
      merge_logs: true, // Tüm instance'ların loglarını birleştir
    },
  ],
}; 