import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FiX, FiUser, FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import stripeService from '../api/stripe-service';
import { useLocation, useNavigate } from 'react-router-dom';

type AuthMode = 'login' | 'register' | 'reset' | 'update_password';

export interface AuthPopupProps {
  triggerReason?: 'send_button' | 'header_button' | 'footer_button' | 'manual';
  onAuthComplete?: () => void;
}

export default function AuthPopup({ triggerReason, onAuthComplete }: AuthPopupProps = {}) {
  const { isLoginOpen, setIsLoginOpen, signIn, signUp, resetPassword, updatePassword, userSubscription } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const location = useLocation();

  // Check for reset password token or error in URL
  useEffect(() => {
    const hash = location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      if (hashParams.get('error') === 'access_denied' && hashParams.get('error_code') === 'otp_expired') {
        createPopup(
          t('invalid_reset_link'),
          t('reset_link_expired'),
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />'
        );
        navigate('/');
      } else if (hash.includes('access_token=')) {
        const token = hashParams.get('access_token');
        if (token) {
          setAccessToken(token);
          setMode('update_password');
        }
      }
    }
  }, [location, navigate, t]);

  // Add a title message based on trigger reason
  const getTriggerMessage = () => {
    switch (triggerReason) {
      case 'send_button':
        return t('auth_required_to_use_ai');
      default:
        return '';
    }
  };

  // Reset form and error when popup opens/closes
  useEffect(() => {
    if (isLoginOpen) {
      if (location.pathname !== '/reset-password') {
        setMode('login');
      }
    } else {
      resetForm();
    }
  }, [isLoginOpen, location.pathname]);

  // Handle reset password URL and keep popup open
  useEffect(() => {
    if (location.pathname === '/reset-password') {
      setIsLoginOpen(true);
      setMode('update_password');
    } else if (location.hash.includes('access_token=')) {
      setIsLoginOpen(true);
      setMode('update_password');
    }
  }, [location, setIsLoginOpen]);

  const createPopup = (title: string, message: string, icon: string) => {
    // Remove any existing popups
    const existingPopup = document.querySelector('.auth-status-popup');
    if (existingPopup) {
      document.body.removeChild(existingPopup);
    }
  
    const popup = document.createElement('div');
    popup.className = 'fixed inset-0 bg-black/80 z-[200] flex items-center justify-center auth-status-popup';
    popup.innerHTML = `
      <div class="relative w-full max-w-md p-8 mx-4 rounded-2xl bg-[var(--theme-background)] border border-purple-500/20 shadow-2xl shadow-purple-500/20 transform transition-all duration-300 scale-100 opacity-100">
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              ${icon}
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-white mb-4">${title}</h3>
          <p class="text-violet-200 mb-6">${message}</p>
          <button class="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-lg shadow-purple-500/30 hover:shadow-pink-500/30 transition-all duration-300 hover:scale-105">${t('got_it')}</button>
        </div>
      </div>
    `;
  
    const closePopup = () => {
      popup.classList.add('opacity-0', 'scale-95');
      setTimeout(() => {
        document.body.removeChild(popup);
        if (onAuthComplete) onAuthComplete();
      }, 300);
    };
  
    const closeButton = popup.querySelector('button');
    closeButton?.addEventListener('click', closePopup);
    popup.addEventListener('click', (e) => {
      if (e.target === popup) closePopup();
    });
  
    document.body.appendChild(popup);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
  
    try {
      if (mode === 'update_password') {
        if (password !== confirmPassword) {
          setError(t('passwords_do_not_match'));
          return;
        }
  
        if (!accessToken) {
          setError(t('invalid_reset_link'));
          return;
        }
  
        const { error } = await updatePassword(password, accessToken);
        if (error) {
          setError(t('password_update_error'));
        } else {
          setIsLoginOpen(false);
          resetForm();
          navigate('/');
          createPopup(
            t('password_updated'),
            t('password_updated_message'),
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />'
          );
        }
      } else if (mode === 'login') {
        const result = await signIn(email, password);
        if (result.error) {
          setError(t('login_error'));
        } else {
          setIsLoginOpen(false);
          resetForm();
          handleRedirect();
          if (onAuthComplete) onAuthComplete();
        }
      } else if (mode === 'reset') {
        if (!email.trim()) {
          setError(t('email_required'));
          return;
        }
  
        const { error } = await resetPassword(email);
        if (error) {
          setError(t('reset_password_error'));
        } else {
          setIsLoginOpen(false);
          resetForm();
          createPopup(
            t('reset_password_email_sent'),
            t('reset_password_check_email'),
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />'
          );
        }
      } else {
        // Registration mode
        const { error, user } = await signUp(email, password, username);
        if (error) {
          setError(t('registration_error'));
        } else {
          setIsLoginOpen(false);
          resetForm();
          createPopup(
            t('email_verification'),
            t('email_verification_message'),
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />'
          );
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError(t('general_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setError(null);
    setIsLoading(false);
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
    setEmail('');
    setPassword('');
    setUsername('');
  };

  const popupVariants = {
    hidden: { opacity: 0, y: -50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    exit: {
      opacity: 0,
      y: -50,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <AnimatePresence>
      {isLoginOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            onClick={() => setIsLoginOpen(false)}
          >
            <motion.div
              className="relative w-full max-w-md p-8 mx-4 rounded-2xl bg-[var(--theme-background)] border border-purple-500/20 shadow-2xl shadow-purple-500/20 z-[101]"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={popupVariants}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                onClick={() => setIsLoginOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-[var(--theme-text-secondary)] hover:text-purple-500 hover:bg-purple-500/10 transition-all duration-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Close"
              >
                <FiX className="w-6 h-6" />
              </motion.button>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-3">
                  {mode === 'login' ? t('login') : mode === 'register' ? t('register') : t('reset_password')}
                </h2>
                <p className="text-[var(--theme-text-secondary)]">
                  {mode === 'login' ? t('login_subtitle') : mode === 'register' ? t('register_subtitle') : t('reset_password_subtitle')}
                </p>
                {getTriggerMessage() && (
                  <div className="mt-4 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <p className="text-[var(--theme-text-primary)]">{getTriggerMessage()}</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'update_password' && (
                  <>
                    <div>
                      <label className="block text-[var(--theme-text-secondary)] mb-2 font-medium">
                        {t('new_password')}
                      </label>
                      <div className="relative">
                        <FiLock className="absolute left-4 top-3.5 text-purple-500" />
                        <input
                          type="password"
                          id="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-purple-500/5 border border-purple-500/20 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-white"
                          placeholder={t('new_password_placeholder')}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[var(--theme-text-secondary)] mb-2 font-medium">
                        {t('confirm_password')}
                      </label>
                      <div className="relative">
                        <FiLock className="absolute left-4 top-3.5 text-purple-500" />
                        <input
                          type="password"
                          id="confirm-new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-purple-500/5 border border-purple-500/20 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-white"
                          placeholder={t('confirm_password_placeholder')}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[var(--theme-text-secondary)] mb-2 font-medium">
                    {t('auth_email')}
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-3.5 text-purple-500" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-purple-500/5 border border-purple-500/20 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-white"
                      placeholder={t('auth_email_placeholder')}
                    />
                  </div>
                </div>

                {(mode === 'login' || mode === 'register') && (
                  <div>
                    <label htmlFor="password" className="block text-[var(--theme-text-secondary)] mb-2 font-medium">
                      {t('password')}
                    </label>
                    <div className="relative">
                      <FiLock className="absolute left-4 top-3.5 text-purple-500" />
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-purple-500/5 border border-purple-500/20 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-white"
                        placeholder={t('password_placeholder')}
                      />
                    </div>
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-6 mt-2 rounded-xl font-medium text-white shadow-lg shadow-purple-500/30 
                    ${isLoading
                      ? 'bg-purple-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-500 hover:to-purple-500 transform hover:scale-[1.02] transition-all duration-300'
                    }`}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('processing')}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <FiLogIn className="w-5 h-5 mr-2" />
                      {mode === 'login' ? t('login') : t('send_reset_password_email')}
                    </span>
                  )}
                </motion.button>

                <div className="text-center mt-6 space-y-2">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-purple-500 hover:text-pink-500 transition-colors duration-300"
                  >
                    {mode === 'login' ? t('need_account') : mode === 'register' ? t('have_account') : t('back_to_login')}
                  </button>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('reset')}
                      className="block w-full text-purple-500 hover:text-pink-500 transition-colors duration-300"
                    >
                      {t('forgot_password')}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
