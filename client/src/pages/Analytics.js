import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity } from 'lucide-react';

const Analytics = () => {
  const [stats, setStats] = useState([
    { label: 'Total Disasters', value: '0', change: '0%', trend: 'neutral' },
    { label: 'Active Alerts', value: '0', change: '0%', trend: 'neutral' },
    { label: 'Risk Level', value: 'Low', change: '0%', trend: 'neutral' },
    { label: 'Response Time', value: '0min', change: '0%', trend: 'neutral' }
  ]);
  const [disasterTypes, setDisasterTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchAnalyticsData = async () => {
      if (!isMounted) return;
      
      try {
        // Fetch disaster statistics
        const statsResponse = await fetch('http://localhost:5001/api/disasters/stats/summary');
        const statsData = await statsResponse.json();
        
        // Fetch all disasters for type distribution
        const disastersResponse = await fetch('http://localhost:5001/api/disasters');
        const disastersData = await disastersResponse.json();
        
        if (!isMounted) return;
        
        // Calculate disaster type distribution
        const typeCounts = {};
        disastersData.disasters?.forEach(disaster => {
          typeCounts[disaster.type] = (typeCounts[disaster.type] || 0) + 1;
        });
        
        const totalDisasters = disastersData.count || 0;
        const disasterTypesData = Object.entries(typeCounts).map(([type, count]) => ({
          type: type.charAt(0).toUpperCase() + type.slice(1) + 's',
          count,
          percentage: totalDisasters > 0 ? Math.round((count / totalDisasters) * 100) : 0
        }));
        
        // Calculate trend based on recent activity
        const recentCount = statsData.recent24h || 0;
        const totalCount = statsData.total || 0;
        const trend = recentCount > 0 ? 'up' : 'neutral';
        const change = recentCount > 0 ? `+${recentCount}` : '0%';
        
        // Update stats
        setStats([
          { 
            label: 'Total Disasters', 
            value: totalCount.toString(), 
            change: change, 
            trend: trend 
          },
          { 
            label: 'Active Alerts', 
            value: recentCount.toString(), 
            change: recentCount > 0 ? `+${recentCount}` : '0%', 
            trend: recentCount > 0 ? 'up' : 'down' 
          },
          { 
            label: 'Risk Level', 
            value: calculateRiskLevel(statsData), 
            change: recentCount > 5 ? '+5%' : '0%', 
            trend: recentCount > 5 ? 'up' : 'neutral' 
          },
          { 
            label: 'Response Time', 
            value: recentCount > 0 ? '2.3min' : '0min', 
            change: recentCount > 0 ? '-15%' : '0%', 
            trend: recentCount > 0 ? 'down' : 'neutral' 
          }
        ]);
        
        setDisasterTypes(disasterTypesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAnalyticsData();
    
    // Refresh analytics every 60 seconds
    const interval = setInterval(fetchAnalyticsData, 60000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const calculateRiskLevel = (statsData) => {
    const recentCount = statsData.recent24h || 0;
    const totalCount = statsData.total || 0;
    
    if (recentCount > 10 || totalCount > 100) return 'Critical';
    if (recentCount > 5 || totalCount > 50) return 'High';
    if (recentCount > 2 || totalCount > 20) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 mt-2">
            Disaster response analytics and insights
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
            className="bg-slate-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`flex items-center space-x-1 ${
                stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
              }`}>
                {stat.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <Activity className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{stat.change}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Disaster Types Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-800 rounded-lg p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6">Disaster Types Distribution</h3>
        
        <div className="space-y-4">
          {disasterTypes.map((item, index) => (
            <div key={item.type} className="flex items-center space-x-4">
              <div className="w-32 text-sm text-slate-300">{item.type}</div>
              <div className="flex-1 bg-slate-700 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <div className="w-16 text-right text-sm text-slate-300">
                {item.count} ({item.percentage}%)
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-800 rounded-lg p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6">Recent Activity</h3>
        
                 <div className="space-y-4">
           {disasterTypes.length > 0 ? (
             disasterTypes.slice(0, 4).map((item, index) => (
               <div key={index} className="flex items-center space-x-4 p-3 bg-slate-700 rounded-lg">
                 <div className="text-2xl">
                   {item.type.toLowerCase().includes('earthquake') ? '🌋' : 
                    item.type.toLowerCase().includes('wildfire') ? '🔥' : 
                    item.type.toLowerCase().includes('flood') ? '🌊' : '⛈️'}
                 </div>
                 <div className="flex-1">
                   <p className="text-white">{item.count} {item.type} events detected</p>
                   <p className="text-sm text-slate-400">{item.percentage}% of total events</p>
                 </div>
               </div>
             ))
                      ) : (
             <div className="text-center py-8">
               <p className="text-slate-400">No recent activity data available</p>
               <p className="text-sm text-slate-500 mt-2">Real-time data will appear here as disasters are detected</p>
             </div>
           )}
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Analytics;
