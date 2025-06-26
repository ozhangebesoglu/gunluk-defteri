import React from 'react'

const TailwindTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 to-blue-500 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Tailwind CSS Test Sayfası
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Kart 1</h2>
            <p className="text-gray-600">Bu kart Tailwind CSS ile yapıldı.</p>
            <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Test Butonu
            </button>
          </div>
          
          <div className="bg-yellow-100 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-yellow-800 mb-4">Kart 2</h2>
            <p className="text-yellow-700">Sarı renkli kart.</p>
            <button className="mt-4 bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">
              Sarı Buton
            </button>
          </div>
          
          <div className="bg-green-100 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-green-800 mb-4">Kart 3</h2>
            <p className="text-green-700">Yeşil renkli kart.</p>
            <button className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
              Yeşil Buton
            </button>
          </div>
        </div>
        
        <div className="mt-8 bg-white/20 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-2xl font-bold text-white mb-4">Tailwind Özellikleri</h3>
          <ul className="text-white space-y-2">
            <li>✅ Gradient arka plan çalışıyor</li>
            <li>✅ Grid layout çalışıyor</li>
            <li>✅ Hover efektleri çalışıyor</li>
            <li>✅ Responsive tasarım çalışıyor</li>
            <li>✅ Shadow efektleri çalışıyor</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default TailwindTest 