import React from 'react';
import { motion } from 'framer-motion';

const GlowingCard = ({ children, className = '', glowColor = 'blue', delay = 0 }) => {
  const glowVariants = {
    initial: { 
      boxShadow: `0 0 20px rgba(59, 130, 246, 0.3)`,
      scale: 1 
    },
    hover: { 
      boxShadow: `0 0 40px rgba(59, 130, 246, 0.6)`,
      scale: 1.02,
      transition: { duration: 0.3 }
    }
  };

  const getGlowColor = () => {
    switch (glowColor) {
      case 'red': return 'rgba(239, 68, 68, 0.6)';
      case 'green': return 'rgba(34, 197, 94, 0.6)';
      case 'yellow': return 'rgba(234, 179, 8, 0.6)';
      case 'purple': return 'rgba(147, 51, 234, 0.6)';
      default: return 'rgba(59, 130, 246, 0.6)';
    }
  };

  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 ${className}`}
      variants={glowVariants}
      initial="initial"
      whileHover="hover"
      style={{
        boxShadow: `0 0 20px ${getGlowColor()}`,
      }}
      transition={{ delay }}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-slate-700/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
      
      {/* Glow effect */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${getGlowColor()}, transparent 70%)`,
          filter: 'blur(20px)',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>
    </motion.div>
  );
};

export default GlowingCard;
