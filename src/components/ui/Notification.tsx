import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface NotificationProps {
  message: string;
  duration?: number;
  onClose: () => void;
}

export const Notification = ({ message, duration = 5000, onClose }: NotificationProps) => {
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [shouldClose, setShouldClose] = useState(false);
  const animationDuration = duration / 1000; // Convert to seconds for Framer Motion

  // Handle the progress bar animation and auto-close
  useEffect(() => {
    if (isHovered) return;

    // Start progress bar animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 30)); // Faster update (30ms instead of 50ms)
        if (newProgress <= 0) {
          clearInterval(interval);
          setShouldClose(true);
          return 0;
        }
        return newProgress;
      });
    }, 30); // Faster updates

    return () => clearInterval(interval);
  }, [duration, isHovered]);

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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-blue-200 dark:border-blue-800"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
              setIsHovered(false);
              // Reset the progress when mouse leaves
              setProgress(100);
            }}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
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
            <div className="bg-blue-100 dark:bg-blue-900 h-1 w-full">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: animationDuration, ease: 'linear' }}
                className="h-full bg-blue-500 dark:bg-blue-400"
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
