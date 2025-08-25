import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const AnimatedStatsCard = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon, 
  color = 'blue',
  delay = 0 
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, parseInt(value) || 0, { duration: 2, delay });
    return controls.stop;
  }, [value, count, delay]);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [rounded]);

  const getColorClasses = () => {
    switch (color) {
      case 'red': return 'from-red-500 to-red-600';
      case 'green': return 'from-green-500 to-green-600';
      case 'yellow': return 'from-yellow-500 to-yellow-600';
      case 'purple': return 'from-purple-500 to-purple-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const getGlowColor = () => {
    switch (color) {
      case 'red': return 'rgba(239, 68, 68, 0.3)';
      case 'green': return 'rgba(34, 197, 94, 0.3)';
      case 'yellow': return 'rgba(234, 179, 8, 0.3)';
      case 'purple': return 'rgba(147, 51, 234, 0.3)';
      default: return 'rgba(59, 130, 246, 0.3)';
    }
  };

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
    >
      {/* Glow effect */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${getGlowColor()}, transparent 70%)`,
          filter: 'blur(20px)',
        }}
      />
      
      {/* Main card */}
      <div className="relative bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-slate-700/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Icon with gradient background */}
        <div className={`relative w-12 h-12 rounded-lg bg-gradient-to-br ${getColorClasses()} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <span className="text-2xl text-white">{icon}</span>
          {/* Icon glow */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <h3 className="text-sm font-medium text-slate-400 mb-2">{title}</h3>
          
          <div className="flex items-baseline space-x-2">
            <motion.span 
              className="text-3xl font-bold text-white"
              key={displayValue}
              initial={{ scale: 1.2, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {displayValue.toLocaleString()}
            </motion.span>
            
            {change && (
              <motion.span 
                className={`text-sm font-medium ${
                  trend === 'up' ? 'text-green-400' : 
                  trend === 'down' ? 'text-red-400' : 'text-slate-400'
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.5 }}
              >
                {change}
              </motion.span>
            )}
          </div>

          {/* Trend indicator */}
          {trend && (
            <motion.div 
              className="flex items-center mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.7 }}
            >
              <motion.div
                className={`w-2 h-2 rounded-full mr-2 ${
                  trend === 'up' ? 'bg-green-400' : 
                  trend === 'down' ? 'bg-red-400' : 'bg-slate-400'
                }`}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <span className="text-xs text-slate-400 capitalize">{trend}</span>
            </motion.div>
          )}
        </div>

        {/* Floating particles effect */}
        <div className="absolute top-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${20 + i * 15}px`,
                top: `${10 + i * 10}px`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AnimatedStatsCard;
