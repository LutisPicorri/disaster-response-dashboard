import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AnimatedNotification = ({ 
  type = 'info', 
  title, 
  message, 
  isVisible, 
  onClose,
  duration = 5000 
}) => {
  React.useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500/20',
          border: 'border-green-500/30',
          icon: '✅',
          glow: 'shadow-green-500/50'
        };
      case 'error':
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500/30',
          icon: '❌',
          glow: 'shadow-red-500/50'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/30',
          icon: '⚠️',
          glow: 'shadow-yellow-500/50'
        };
      case 'disaster':
        return {
          bg: 'bg-red-600/20',
          border: 'border-red-600/30',
          icon: '🚨',
          glow: 'shadow-red-600/50'
        };
      default:
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/30',
          icon: 'ℹ️',
          glow: 'shadow-blue-500/50'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed top-4 right-4 z-50 max-w-sm w-full ${styles.bg} ${styles.border} border backdrop-blur-sm rounded-lg p-4 ${styles.glow}`}
          initial={{ 
            opacity: 0, 
            x: 300, 
            scale: 0.8,
            rotateY: -15
          }}
          animate={{ 
            opacity: 1, 
            x: 0, 
            scale: 1,
            rotateY: 0
          }}
          exit={{ 
            opacity: 0, 
            x: 300, 
            scale: 0.8,
            rotateY: 15
          }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
          
          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-start space-x-3">
              {/* Icon */}
              <motion.div
                className="text-2xl"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                {styles.icon}
              </motion.div>
              
              {/* Text content */}
              <div className="flex-1 min-w-0">
                <motion.h4
                  className="text-sm font-semibold text-white mb-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {title}
                </motion.h4>
                <motion.p
                  className="text-xs text-slate-300"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {message}
                </motion.p>
              </div>
              
              {/* Close button */}
              <motion.button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
            
            {/* Progress bar */}
            <motion.div
              className="mt-3 h-1 bg-slate-700 rounded-full overflow-hidden"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: duration / 1000, ease: "linear" }}
              />
            </motion.div>
          </div>
          
          {/* Floating particles */}
          <div className="absolute top-0 right-0 w-16 h-16 opacity-0 hover:opacity-100 transition-opacity duration-500">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${10 + i * 8}px`,
                  top: `${5 + i * 6}px`,
                }}
                animate={{
                  y: [0, -15, 0],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedNotification;
