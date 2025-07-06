import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

const UpdatePassword = () => {
  const { isDarkTheme } = useTheme();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  
  useEffect(() => {
    // Supabase JS client handles the fragment from the URL automatically
    // We just need to get the session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
         toast.error("Geçersiz veya süresi dolmuş şifre sıfırlama linki. Lütfen yeni bir talep oluşturun.");
         setTimeout(() => navigate('/auth/request-reset'), 3000);
      } else {
        setSession(session);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setSession(session);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Şifreler eşleşmiyor!');
      return;
    }
    if (password.length < 8) {
      toast.error('Şifre en az 8 karakter olmalıdır.');
      return;
    }
    setLoading(true);

    try {
      // The user object is already in the supabase instance due to the session
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        throw error;
      }
      
      toast.success('Şifreniz başarıyla güncellendi! Giriş sayfasına yönlendiriliyorsunuz.');
      
      // Log the user out fully before navigating
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate('/auth');
      }, 3000);

    } catch (error: any) {
      toast.error(error.message || 'Şifre güncellenemedi. Lütfen tekrar deneyin.');
      console.error('Password update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
       <div className={`flex items-center justify-center min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-amber-50'}`}>
          <Toaster position="top-center" reverseOrder={false} />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
       </div>
    );
  }

  return (
    <div className={`flex items-center justify-center min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-amber-50'}`}>
       <Toaster position="top-center" reverseOrder={false} />
       <div className={`w-full max-w-md p-8 space-y-8 rounded-2xl shadow-2xl ${isDarkTheme ? 'bg-rich-brown-800' : 'bg-white'}`}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center">
            <h1 className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Yeni Şifre Belirle</h1>
            <p className={`mt-2 text-md ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Lütfen yeni şifrenizi girin.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="relative">
              <KeyRound className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 ${isDarkTheme ? 'bg-rich-brown-700 border-rich-brown-600 text-white focus:ring-amber-500' : 'border-gray-300 focus:ring-amber-500'}`}
                placeholder="Yeni Şifre"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="relative">
              <KeyRound className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                id="confirm-password"
                name="confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 ${isDarkTheme ? 'bg-rich-brown-700 border-rich-brown-600 text-white focus:ring-amber-500' : 'border-gray-300 focus:ring-amber-500'}`}
                placeholder="Yeni Şifreyi Onayla"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
              >
                {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default UpdatePassword; 