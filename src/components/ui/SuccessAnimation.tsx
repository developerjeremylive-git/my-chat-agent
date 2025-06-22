import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface SuccessAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ isVisible, onComplete }) => {
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setAnimationComplete(false);
      const timer = setTimeout(() => {
        setAnimationComplete(true);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && !animationComplete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
              scale: [0.5, 1.2, 1],
              opacity: 1,
              transition: { 
                duration: 0.5,
                ease: [0.175, 0.885, 0.32, 1.275]
              }
            }}
            exit={{ 
              scale: 0.8, 
              opacity: 0,
              transition: { duration: 0.2 }
            }}
            className="bg-green-500/90 dark:bg-green-600/90 p-6 rounded-full shadow-2xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ 
                scale: 1,
                transition: { 
                  delay: 0.2,
                  type: 'spring',
                  stiffness: 300,
                  damping: 20
                }
              }}
            >
              <CheckCircle2 className="w-16 h-16 text-white" strokeWidth={1.5} />
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
