import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { CheckCircle, Warning, Info, X, Trash, XCircle, PencilSimple } from '@phosphor-icons/react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'deletion' | 'titleUpdate';

interface NotificationProps {
  message: string;
  duration?: number;
  onClose: () => void;
  type?: NotificationType;
}

const notificationStyles = {
  success: {
    bg: 'bg-green-100 dark:bg-green-800',
    border: 'border-green-200 dark:border-green-700',
    text: 'text-green-900 dark:text-white',
    icon: CheckCircle,
    iconColor: 'text-green-600 dark:text-green-300',
    progressBg: 'bg-green-200 dark:bg-green-700',
    progressBar: 'bg-green-600 dark:bg-green-300',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/80',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-100',
    icon: XCircle,
    iconColor: 'text-red-500 dark:text-red-300',
    progressBg: 'bg-red-100 dark:bg-red-800/50',
    progressBar: 'bg-red-500 dark:bg-red-400',
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-800',
    border: 'border-blue-200 dark:border-blue-700',
    text: 'text-blue-900 dark:text-white',
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-300',
    progressBg: 'bg-blue-200 dark:bg-blue-700',
    progressBar: 'bg-blue-600 dark:bg-blue-300',
  },
  warning: {
    bg: 'bg-yellow-100 dark:bg-yellow-800',
    border: 'border-yellow-200 dark:border-yellow-700',
    text: 'text-yellow-900 dark:text-white',
    icon: Warning,
    iconColor: 'text-yellow-600 dark:text-yellow-300',
    progressBg: 'bg-yellow-200 dark:bg-yellow-700',
    progressBar: 'bg-yellow-600 dark:bg-yellow-300',
  },
  deletion: {
    bg: 'bg-orange-100 dark:bg-orange-800',
    border: 'border-orange-200 dark:border-orange-700',
    text: 'text-orange-900 dark:text-white',
    icon: Trash,
    iconColor: 'text-orange-600 dark:text-orange-300',
    progressBg: 'bg-orange-200 dark:bg-orange-700',
    progressBar: 'bg-orange-600 dark:bg-orange-300',
  },
  titleUpdate: {
    bg: 'bg-purple-100 dark:bg-purple-800',
    border: 'border-purple-200 dark:border-purple-700',
    text: 'text-purple-900 dark:text-white',
    icon: PencilSimple,
    iconColor: 'text-purple-600 dark:text-purple-300',
    progressBg: 'bg-purple-200 dark:bg-purple-700',
    progressBar: 'bg-purple-600 dark:bg-purple-300',
  },
} as const;

export const Notification = ({ message, duration = 5000, onClose, type = 'info' }: NotificationProps) => {
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(true);
  const [startTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isPaused, setIsPaused] = useState(false);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [pausedProgress, setPausedProgress] = useState(100);
  const [shouldClose, setShouldClose] = useState(false);

  // Handle the progress bar animation and auto-close
  useEffect(() => {
    if (duration <= 0) return;

    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - lastUpdate;
      
      if (!isPaused) {
        setTimeRemaining(prev => {
          const newTimeRemaining = Math.max(0, prev - elapsed);
          const newProgress = (newTimeRemaining / duration) * 100;
          setProgress(newProgress);
          
          if (newTimeRemaining <= 0) {
            setIsVisible(false);
            setTimeout(onClose, 200); // Wait for exit animation
            return 0;
          }
          
          return newTimeRemaining;
        });
      }
      
      setLastUpdate(now);
      animationFrameId = requestAnimationFrame(updateProgress);
    };

    let animationFrameId = requestAnimationFrame(updateProgress);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [duration, onClose, isPaused, lastUpdate]);
  
  const handleMouseEnter = () => {
    setIsPaused(true);
    setPausedProgress(progress);
  };
  
  const handleMouseLeave = () => {
    setIsPaused(false);
    setLastUpdate(Date.now());
    setTimeRemaining((duration * progress) / 100);
  };

  // Handle the close animation when progress reaches 0
  useEffect(() => {
    if (shouldClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
      }, 100); // Small delay to ensure progress bar completes
      
      return () => clearTimeout(timer);
    }
  }, [shouldClose, onClose]);

  const notification = (
    <div style={{
      position: 'fixed',
      top: '16px',
      right: '16px',
      zIndex: 9999, // Very high z-index
      pointerEvents: 'auto',
      width: '320px'
    }}>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            className={`${notificationStyles[type].bg} ${notificationStyles[type].border} rounded-lg shadow-lg overflow-hidden`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className={`flex-shrink-0 pt-0.5 ${notificationStyles[type].iconColor}`}>
                  {(() => {
                    const Icon = notificationStyles[type].icon;
                    return <Icon weight="fill" size={20} />;
                  })()}
                </div>
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${notificationStyles[type].text}`}>
                    {message}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsVisible(false);
                    onClose();
                  }}
                  className="ml-4 -mx-1.5 -my-1.5 bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex h-8 w-8"
                >
                  <span className="sr-only">Cerrar</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <div className={`${notificationStyles[type].progressBg} h-1 w-full overflow-hidden`}>
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: `${isPaused ? pausedProgress : progress}%` }}
                transition={{ 
                  duration: isPaused ? 0 : 0.02, // Pause animation when hovered
                  ease: 'linear'
                }}
                className={`h-full ${notificationStyles[type].progressBar} transition-[width] duration-75 ease-linear`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return createPortal(notification, document.body);
};

export default Notification;
