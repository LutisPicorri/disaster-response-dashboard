import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  Shield,
  Globe,
  MapPin,
  TrendingUp,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import DisasterMap from '../components/DisasterMap';
import StatsCard from '../components/StatsCard';
import DisasterList from '../components/DisasterList';
import RiskPrediction from '../components/RiskPrediction';
import AlertPanel from '../components/AlertPanel';
import AnimatedHeader from '../components/AnimatedHeader';
import AnimatedStatsCard from '../components/AnimatedStatsCard';
import GlowingCard from '../components/GlowingCard';

// Hooks
import { useSocket } from '../hooks/useSocket';
import { useDisasters } from '../hooks/useDisasters';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDisasters: 0,
    activeAlerts: 0,
    recentEvents: 0,
    riskLevel: 'low'
  });
  const [recentDisasters, setRecentDisasters] = useState([]);
  const [riskPredictions, setRiskPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { socket, isConnected } = useSocket();
  const { disasters, loading: disastersLoading } = useDisasters();

  console.log('🔌 Socket status:', { socket: !!socket, isConnected, socketType: typeof socket });

  // Calculate risk level based on statistics
  const calculateRiskLevel = (statsData) => {
    const recentCount = statsData.recent24h || 0;
    const totalCount = statsData.total || 0;
    
    if (recentCount > 10 || totalCount > 100) return 'critical';
    if (recentCount > 5 || totalCount > 50) return 'high';
    if (recentCount > 2 || totalCount > 20) return 'medium';
    return 'low';
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('🔄 Fetching dashboard data...');
        
        // Fetch statistics from API
        const statsResponse = await fetch('http://localhost:5001/api/disasters/stats/summary');
        const statsData = await statsResponse.json();
        
        // Fetch recent disasters
        const disastersResponse = await fetch('http://localhost:5001/api/disasters?limit=10');
        const disastersData = await disastersResponse.json();
        
        // Fetch risk predictions
        const riskResponse = await fetch('http://localhost:5001/api/risk-predictions');
        const riskData = await riskResponse.json();

        setStats({
          totalDisasters: statsData.total || 0,
          activeAlerts: statsData.recent24h || 0,
          recentEvents: disastersData.count || 0,
          riskLevel: calculateRiskLevel(statsData)
        });
        
        setRecentDisasters(disastersData.disasters || []);
        setRiskPredictions(riskData.predictions || []);
        
        setLoading(false);
        console.log('✅ Dashboard data loaded successfully');
        console.log('🤖 Risk predictions received:', riskData.predictions?.length || 0, 'predictions');
        if (riskData.predictions?.length > 0) {
          console.log('🤖 Sample predictions:', riskData.predictions.slice(0, 3).map(p => ({
            region: p.region,
            type: p.disaster_type,
            risk: p.risk_score,
            confidence: p.confidence
          })));
        }
      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        
        // Fallback to sample data if API fails
        console.log('🔄 Using fallback sample data...');
        setStats({
          totalDisasters: 0,
          activeAlerts: 0,
          recentEvents: 0,
          riskLevel: 'low'
        });
        
        setRecentDisasters([]);
        setRiskPredictions([]);
        
        setLoading(false);
        toast.error('Failed to load dashboard data, showing empty state');
      }
    };

    fetchDashboardData();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket || typeof socket.on !== 'function') {
      console.log('⚠️ Socket not available, skipping socket event listeners');
      return;
    }

    console.log('🔌 Setting up socket event listeners...');

    const handleDisasterUpdate = (data) => {
      if (data.type === 'new_disasters') {
        setRecentDisasters(prev => [...data.data, ...prev.slice(0, 9)]);
        setStats(prev => ({
          ...prev,
          totalDisasters: prev.totalDisasters + data.data.length,
          recentEvents: prev.recentEvents + data.data.length
        }));
        
        // Show toast for new disasters
        data.data.forEach(disaster => {
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      New {disaster.type} alert
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {disaster.description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Close
                </button>
              </div>
            </div>
          ), {
            duration: 6000,
          });
        });
      }
    };

    const handleRiskAlert = (data) => {
      if (data.type === 'high_risk_alert') {
        toast.error(`High risk alert: ${data.predictions.length} high-risk predictions detected`);
      }
    };

    try {
      socket.on('disasterUpdate', handleDisasterUpdate);
      socket.on('riskAlert', handleRiskAlert);
      console.log('✅ Socket event listeners set up successfully');
    } catch (error) {
      console.error('❌ Error setting up socket event listeners:', error);
    }

    return () => {
      try {
        if (socket && typeof socket.off === 'function') {
          socket.off('disasterUpdate', handleDisasterUpdate);
          socket.off('riskAlert', handleRiskAlert);
          console.log('🧹 Socket event listeners cleaned up');
        }
      } catch (error) {
        console.error('❌ Error cleaning up socket event listeners:', error);
      }
    };
  }, [socket]);



  const getRiskColor = (level) => {
    switch (level) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  console.log('🎨 Rendering Dashboard component');
  
  return (
    <div className="space-y-8">
      {/* Animated Header */}
      <AnimatedHeader 
        title="Disaster Response Dashboard"
        subtitle="Real-time monitoring and emergency response system for Europe"
        className="mb-8"
      />

      {/* Risk Level Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center"
      >
        <div className={`flex items-center space-x-3 px-6 py-3 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 ${getRiskColor(stats.riskLevel)}`}>
          <Activity className="h-5 w-5" />
          <span className="text-lg font-semibold capitalize">{stats.riskLevel} risk level</span>
          <motion.div
            className="w-3 h-3 rounded-full bg-current"
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
        </div>
      </motion.div>

      {/* Animated Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedStatsCard
          title="Total Disasters"
          value={stats.totalDisasters}
          icon="🌋"
          change="+12%"
          trend="up"
          color="red"
          delay={0.1}
        />
        <AnimatedStatsCard
          title="Active Alerts"
          value={stats.activeAlerts}
          icon="🚨"
          change="+5%"
          trend="up"
          color="yellow"
          delay={0.2}
        />
        <AnimatedStatsCard
          title="Recent Events"
          value={stats.recentEvents}
          icon="⏰"
          change="-3%"
          trend="down"
          color="blue"
          delay={0.3}
        />
        <AnimatedStatsCard
          title="Risk Level"
          value={stats.riskLevel.toUpperCase()}
          icon="🛡️"
          change="Stable"
          trend="neutral"
          color="green"
          delay={0.4}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2"
        >
                     <GlowingCard className="h-96" glowColor="blue">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-semibold text-white">Live Disaster Map</h2>
               <div className="flex items-center space-x-2 text-sm text-slate-400">
                 <Globe className="h-4 w-4" />
                 <span>Real-time updates</span>
               </div>
             </div>
             <div className="h-80 w-full">
               <DisasterMap disasters={disasters} />
             </div>
           </GlowingCard>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-6"
        >
          {/* Risk Predictions */}
          <GlowingCard glowColor="purple">
            <RiskPrediction predictions={riskPredictions} />
          </GlowingCard>

          {/* Recent Alerts */}
          <GlowingCard glowColor="yellow">
            <AlertPanel alerts={[]} />
          </GlowingCard>
        </motion.div>
      </div>

      {/* Recent Disasters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <GlowingCard glowColor="green">
          <DisasterList disasters={recentDisasters} loading={disastersLoading} />
        </GlowingCard>
      </motion.div>
    </div>
  );
};

export default Dashboard;
