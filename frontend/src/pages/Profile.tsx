import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { User, Mail, Shield, LogOut, KeyRound } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Şifre en az 8 karakter olmalıdır.');
      return;
    }

    setIsUpdating(true);
    toast.loading('Şifre güncelleniyor...', { id: 'password-update' });

    try {
      await apiService.updatePassword(newPassword);
      toast.success('Şifreniz başarıyla güncellendi.', { id: 'password-update' });
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Şifre güncellenirken bir hata oluştu.', { id: 'password-update' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-amber-700">Kullanıcı bilgileri yükleniyor...</p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto p-4 md:p-8"
    >
      <div className="bg-white/80 dark:bg-rich-brown-800/90 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden p-8 border border-orange-200 dark:border-rich-brown-600">
        
        <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="relative w-32 h-32 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-500 dark:to-orange-600 flex items-center justify-center text-5xl font-bold text-white shadow-lg mb-6 md:mb-0 md:mr-8"
          >
            {getInitials(profile.full_name)}
          </motion.div>
          
          <div className="flex-grow">
            <h1 className="text-4xl font-serif font-bold text-orange-900 dark:text-rich-brown-100">{profile.full_name}</h1>
            <p className="text-amber-700 dark:text-amber-300 mt-2 flex items-center justify-center md:justify-start">
              <Mail className="mr-2" size={18} />
              {user.email}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Üyelik Tarihi: {new Date(user.created_at).toLocaleDateString('tr-TR')}
            </p>
          </div>
          
          <button
            onClick={signOut}
            className="mt-6 md:mt-0 flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <LogOut className="mr-2" size={18} />
            Çıkış Yap
          </button>
        </div>

        <hr className="my-8 border-orange-200 dark:border-rich-brown-700" />

        <div>
          <h2 className="text-2xl font-serif text-orange-800 dark:text-rich-brown-200 mb-4 flex items-center">
            <Shield className="mr-3 text-amber-500" />
            Güvenlik Ayarları
          </h2>
          
          <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-sm">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Yeni Şifre
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 border border-orange-300 dark:border-rich-brown-600 rounded-lg bg-orange-50 dark:bg-rich-brown-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                  disabled={isUpdating}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isUpdating || newPassword.length < 8}
              className="w-full flex items-center justify-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <User className="mr-2" size={18} />
              {isUpdating ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </button>
          </form>
        </div>

      </div>
    </motion.div>
  );
};

export default Profile; 