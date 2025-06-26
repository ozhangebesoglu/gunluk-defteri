"use client";
import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";

interface LampProps {
  className?: string;
}

export const Lamp: React.FC<LampProps> = ({ className = "" }) => {
  const { isDarkTheme, toggleTheme } = useTheme();
  
  // Lamba durumu sadece tema durumuna bağlı - extra state yok
  const isOn = !isDarkTheme; // Light theme = lamba açık, Dark theme = lamba kapalı

  const handleToggle = () => {
    toggleTheme(); // Sadece tema context'ini toggle et
  };

  return (
    <div className={`fixed top-1 left-1/2 transform -translate-x-1/2 z-10 ${className}`}>
      {/* Lamba Container */}
      <div className="relative flex flex-col items-center">
        {/* Asma Kablosu - ÜST KISIM */}
        <motion.div 
          className={`w-1 transition-all duration-500 ${
            isDarkTheme 
              ? 'bg-gradient-to-b from-slate-600 to-slate-700' 
              : 'bg-gradient-to-b from-amber-800 to-amber-900'
          }`}
          style={{ height: '30px' }}
          animate={{
            scaleY: isOn ? 1 : 0.9
          }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Lamba - Geniş ve Kısa Dikdörtgen */}
        <motion.div
          className="relative w-56 h-10 cursor-pointer"
          onClick={handleToggle}
          animate={{
            scale: isOn ? 1 : 0.98,
          }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
        >
          {/* Işık Halesi (her zaman var ama opacity değişiyor) */}
          <motion.div
            className="absolute inset-0 z-0"
            animate={{ 
              opacity: isOn ? 1 : 0,
              scale: isOn ? 1 : 0.9
            }}
            transition={{ duration: 0.4 }}
          >
            {/* Glow Effect - Sarı/Turuncu */}
            <div className="absolute -inset-8 bg-gradient-radial from-yellow-400/30 via-orange-300/20 to-transparent rounded-full blur-xl"></div>
            <div className="absolute -inset-4 bg-gradient-radial from-yellow-300/40 via-orange-200/30 to-transparent rounded-full blur-lg"></div>
          </motion.div>

          {/* Ana Lamba Gövdesi - Sarı/Turuncu */}
          <motion.div
            className={`relative z-10 w-full h-full transition-all duration-500 ${
              isOn 
                ? 'bg-gradient-to-b from-yellow-300 to-orange-500 shadow-orange-400/50 shadow-lg' 
                : 'bg-gradient-to-b from-slate-600 to-slate-800 shadow-slate-600/30 shadow-md'
            }`}
            style={{
              clipPath: 'polygon(8% 0%, 92% 0%, 88% 100%, 12% 100%)', // Trapez şekli
            }}
            animate={{
              boxShadow: isOn 
                ? "0 0 30px rgba(251, 146, 60, 0.6), 0 0 60px rgba(251, 146, 60, 0.3)" 
                : "0 4px 15px rgba(0, 0, 0, 0.3)"
            }}
            transition={{ duration: 0.5 }}
          >
            {/* İç Işık */}
            <motion.div
              className="absolute inset-1 bg-gradient-to-b from-white/80 to-yellow-200/60 rounded-sm"
              style={{
                clipPath: 'polygon(0% 0%, 94% 0%, 91% 50%, 9% 50%)',
              }}
              animate={{ 
                opacity: isOn ? [0.8, 1, 0.8] : 0
              }}
              transition={{ 
                duration: isOn ? 3 : 0.5, 
                repeat: isOn ? Infinity : 0, 
                ease: "easeInOut" 
              }}
            />

            {/* Lamba Detayları */}
            <div className={`absolute top-1 left-1/2 transform -translate-x-1/2 w-24 h-0.5 transition-colors duration-500 ${
              isOn ? 'bg-yellow-200/80' : 'bg-slate-400/60'
            }`}></div>
            <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-0.5 transition-colors duration-500 ${
              isOn ? 'bg-yellow-200/60' : 'bg-slate-400/40'
            }`}></div>
          </motion.div>
        </motion.div>
        
        
      </div>
    </div>
  );
};

export default Lamp; 