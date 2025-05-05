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
      whileHover={{ scale: 1.05, rotate: 2 }}
      whileTap={{ scale: 0.95, rotate: -2 }}
      onClick={handleAuth}
      className={`
        relative overflow-hidden
        flex items-center justify-center
        px-6 py-3 mx-auto
        rounded-xl font-semibold
        transition-all duration-300
        shadow-lg hover:shadow-xl
        before:absolute before:inset-0
        before:bg-gradient-to-r before:from-[#F48120] before:to-purple-500
        before:transition-all before:duration-300
        hover:before:opacity-0
        after:absolute after:inset-0
        after:bg-gradient-to-r after:from-purple-500 after:to-[#F48120]
        after:opacity-0 after:transition-all after:duration-300
        hover:after:opacity-100
        ${className}
        ${variant === 'footer' ? 'text-sm px-4 py-2' : 'text-base'}
      `}
    >
      <div className="relative z-10 flex items-center justify-center text-white">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.2 }}
          className="flex items-center"
        >
          {user ? (
            <>
              <FiLogOut className="w-5 h-5 mr-3" />
              <span className="whitespace-nowrap font-medium">{'Cerrar sesión'}</span>
            </>
          ) : (
            <>
              <FiLogIn className="w-5 h-5 mr-3" />
              <span className="whitespace-nowrap font-medium">{'Iniciar sesión'}</span>
            </>
          )}
        </motion.div>
      </div>
    </motion.button>
  );
}
