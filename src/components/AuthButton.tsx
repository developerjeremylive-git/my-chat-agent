import React from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiLogIn, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
// import { useLanguage } from '../context/LanguageContext';

export interface AuthButtonProps {
  variant?: 'header' | 'footer';
  className?: string;
}

export default function AuthButton({ variant = 'header', className = '' }: AuthButtonProps) {
  const { user, isLoginOpen, setIsLoginOpen, logout } = useAuth();
  // const { t } = useLanguage();

  const handleAuth = () => {
    if (user) {
      logout();
    } else {
      setIsLoginOpen(true);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.90 }}
      onClick={handleAuth}
      className={`flex items-center justify-center px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg ${className} ${
        user 
          ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-pink-500 hover:to-red-500 text-white shadow-red-500/30 hover:shadow-pink-500/30' 
          : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-500 hover:to-purple-500 text-white shadow-purple-500/30 hover:shadow-pink-500/30'
      } ${
        variant === 'footer' 
          ? 'text-sm px-4 py-2' 
          : 'text-sm'
      }`}
    >
      {user ? (
        <>
          <FiLogOut className="w-4 h-4 mr-2" />
          <span className="whitespace-nowrap">{'Cerrar sesión'}</span>
        </>
      ) : (
        <>
          <FiLogIn className="w-4 h-4 mr-2" />
          <span className="whitespace-nowrap">{'Iniciar sesión'}</span>
        </>
      )}
    </motion.button>
  );
}
