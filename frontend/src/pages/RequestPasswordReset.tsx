import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/api';
import { Link } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { Mail, ArrowLeft } from 'lucide-react';

const RequestPasswordReset: React.FC = () => {
  const { isDarkTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await apiService.requestPasswordReset(email);
      setMessage(response.message);
      toast.success('İstek gönderildi! E-postanızı kontrol edin.');
    } catch (error) {
      toast.error('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      console.error('Password reset request failed:', error);
      setMessage('Eğer bu e-posta adresi sistemimizde kayıtlıysa, şifre sıfırlama talimatlarını içeren bir e-posta gönderildi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex items-center justify-center min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-amber-50'}`}>
      <Toaster position="top-center" reverseOrder={false} />
      <div className={`w-full max-w-md p-8 space-y-8 rounded-2xl shadow-2xl ${isDarkTheme ? 'bg-rich-brown-800' : 'bg-white'}`}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center">
            <h1 className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Şifreni mi Unuttun?</h1>
            <p className={`mt-2 text-md ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Sorun değil. E-posta adresinizi girin, size yeni bir şifre belirlemeniz için bir bağlantı gönderelim.
            </p>
          </div>

          {message ? (
            <div className="mt-6 text-center p-4 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-lg">
              <p>{message}</p>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 ${isDarkTheme ? 'bg-rich-brown-700 border-rich-brown-600 text-white focus:ring-amber-500' : 'border-gray-300 focus:ring-amber-500'}`}
                  placeholder="E-posta Adresiniz"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                >
                  {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
                </button>
              </div>
            </form>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <Link to="/auth" className={`font-medium text-amber-600 hover:text-amber-500 inline-flex items-center gap-2`}>
              <ArrowLeft size={16} />
              Giriş ekranına geri dön
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default RequestPasswordReset; 