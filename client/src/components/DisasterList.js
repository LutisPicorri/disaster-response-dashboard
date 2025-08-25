import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, MapPin } from 'lucide-react';

const DisasterList = ({ disasters = [] }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/10';
      case 'high': return 'text-orange-500 bg-orange-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      default: return 'text-blue-500 bg-blue-500/10';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'earthquake': return '🌋';
      case 'wildfire': return '🔥';
      case 'flood': return '🌊';
      case 'weather': return '⛈️';
      default: return '⚠️';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 rounded-lg p-6"
    >
      <div className="flex items-center space-x-3 mb-6">
        <AlertTriangle className="w-6 h-6 text-orange-500" />
        <h3 className="text-xl font-semibold text-white">Recent Disasters</h3>
      </div>
      
      <div className="space-y-4">
        {disasters.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">No recent disasters</p>
          </div>
        ) : (
          disasters.slice(0, 5).map((disaster, index) => (
            <motion.div
              key={disaster.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-4 p-4 bg-slate-700 rounded-lg"
            >
              <div className="text-2xl">{getTypeIcon(disaster.type)}</div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-1">
                  <h4 className="text-white font-medium capitalize">
                    {disaster.type}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(disaster.severity)}`}>
                    {disaster.severity}
                  </span>
                </div>
                
                <p className="text-slate-300 text-sm mb-2">
                  {disaster.description}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{disaster.latitude.toFixed(2)}, {disaster.longitude.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(disaster.timestamp)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default DisasterList;
