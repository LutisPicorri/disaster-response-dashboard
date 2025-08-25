import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useDisasters } from '../hooks/useDisasters';

const Alerts = () => {
  const { disasters, loading } = useDisasters();
  const [alerts, setAlerts] = useState([]);

  // Convert disasters to alerts format
  useEffect(() => {
    const disasterAlerts = disasters.map((disaster, index) => ({
      id: disaster.id || index,
      type: disaster.type,
      severity: disaster.severity,
      title: `${disaster.type.charAt(0).toUpperCase() + disaster.type.slice(1)} Alert`,
      message: disaster.description,
      timestamp: disaster.timestamp,
      isRead: false,
      location: `${disaster.latitude.toFixed(2)}, ${disaster.longitude.toFixed(2)}`
    }));
    setAlerts(disasterAlerts);
  }, [disasters]);

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
      case 'weather': return '⛈️';
      default: return '⚠️';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Alerts</h1>
          <p className="text-slate-400 mt-2">
            Real-time disaster alerts and notifications
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {alerts.filter(alert => !alert.isRead).length}
            </div>
            <div className="text-sm text-slate-400">Active Alerts</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="spinner"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Active Alerts</h3>
            <p className="text-slate-400">Real-time disaster alerts will appear here as they are detected</p>
          </div>
        ) : (
          alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-slate-800 rounded-lg p-6 border-l-4 ${
              alert.isRead ? 'border-slate-600' : 'border-red-500'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className="text-2xl">{getTypeIcon(alert.type)}</div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">
                    {alert.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  {!alert.isRead && (
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </div>
                
                <p className="text-slate-300 mb-3">
                  {alert.message}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    {!alert.isRead && (
                      <button className="text-sm text-blue-400 hover:text-blue-300">
                        Mark as Read
                      </button>
                    )}
                    <button className="text-sm text-slate-400 hover:text-slate-300">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )))}
      </motion.div>
    </div>
  );
};

export default Alerts;
