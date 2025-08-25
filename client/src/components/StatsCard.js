import React from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ title, value, change, trend, icon: Icon }) => {
  const getTrendColor = (trend) => {
    if (trend === 'up') return 'text-green-500';
    if (trend === 'down') return 'text-red-500';
    return 'text-slate-400';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '↗';
    if (trend === 'down') return '↘';
    return '→';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 rounded-lg p-6 border border-slate-700"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        {Icon && (
          <div className="text-blue-500">
            <Icon className="w-8 h-8" />
          </div>
        )}
      </div>
      
      {change && (
        <div className={`flex items-center space-x-1 mt-2 ${getTrendColor(trend)}`}>
          <span className="text-sm font-medium">{getTrendIcon(trend)}</span>
          <span className="text-sm">{change}</span>
        </div>
      )}
    </motion.div>
  );
};

export default StatsCard;
