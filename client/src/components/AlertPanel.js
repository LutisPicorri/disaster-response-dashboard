import React from 'react';
import { motion } from 'framer-motion';
import { Bell, X, Check } from 'lucide-react';

const AlertPanel = ({ alerts = [], onDismiss }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-500/5';
      case 'high': return 'border-orange-500 bg-orange-500/5';
      case 'medium': return 'border-yellow-500 bg-yellow-500/5';
      default: return 'border-blue-500 bg-blue-500/5';
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-red-500" />
          <h3 className="text-xl font-semibold text-white">Active Alerts</h3>
          {alerts.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {alerts.length}
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-slate-400">All clear! No active alerts</p>
          </div>
        ) : (
          alerts.slice(0, 3).map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border-l-4 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{getTypeIcon(alert.type)}</div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-white font-medium">
                        {alert.title}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity).replace('border-', 'text-').replace('/5', '')}`}>
                        {alert.severity}
                      </span>
                    </div>
                    
                    <p className="text-slate-300 text-sm mb-2">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-slate-400">
                      <span>{formatTime(alert.timestamp)}</span>
                      <span>•</span>
                      <span className="capitalize">{alert.type}</span>
                    </div>
                  </div>
                </div>
                
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(alert.id)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default AlertPanel;
