import React from 'react'

const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 to-orange-200 paper-texture">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-serif font-bold text-amber-900 mb-4">
              📖 Günce Defteri
            </h1>
            <p className="text-lg text-amber-700 font-medium">
              Anılarınız güvende, düşünceleriniz organize
            </p>
          </div>

          {/* Test Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white paper-texture rounded-xl shadow-lg p-6 card-hover">
              <div className="text-3xl mb-4">🏠</div>
              <h3 className="text-xl font-serif font-semibold text-amber-900 mb-2">
                Ana Sayfa
              </h3>
              <p className="text-amber-700">
                Dashboard ve genel bakış
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white paper-texture rounded-xl shadow-lg p-6 card-hover">
              <div className="text-3xl mb-4">📚</div>
              <h3 className="text-xl font-serif font-semibold text-amber-900 mb-2">
                Günceler
              </h3>
              <p className="text-amber-700">
                Tüm günce kayıtlarınız
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white paper-texture rounded-xl shadow-lg p-6 card-hover">
              <div className="text-3xl mb-4">✏️</div>
              <h3 className="text-xl font-serif font-semibold text-amber-900 mb-2">
                Yeni Kayıt
              </h3>
              <p className="text-amber-700">
                Yeni günce kaydı oluştur
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white paper-texture rounded-xl shadow-lg p-6 card-hover">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-serif font-semibold text-amber-900 mb-2">
                İstatistikler
              </h3>
              <p className="text-amber-700">
                Yazma alışkanlıklarınız
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-white paper-texture rounded-xl shadow-lg p-6 card-hover">
              <div className="text-3xl mb-4">⚙️</div>
              <h3 className="text-xl font-serif font-semibold text-amber-900 mb-2">
                Ayarlar
              </h3>
              <p className="text-amber-700">
                Uygulama ayarları
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-white paper-texture rounded-xl shadow-lg p-6 card-hover">
              <div className="text-3xl mb-4">🔒</div>
              <h3 className="text-xl font-serif font-semibold text-amber-900 mb-2">
                Güvenlik
              </h3>
              <p className="text-amber-700">
                Verileriniz şifreli
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="mt-12 text-center">
            <div className="bg-white paper-texture rounded-xl shadow-lg p-6 inline-block">
              <div className="text-2xl mb-2">✅</div>
              <h3 className="text-lg font-serif font-semibold text-amber-900 mb-2">
                Uygulama Başarıyla Yüklendi
              </h3>
              <p className="text-amber-700">
                Tailwind CSS ve React Router çalışıyor
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestPage 