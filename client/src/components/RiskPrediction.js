import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, AlertTriangle } from 'lucide-react';

const RiskPrediction = ({ predictions = [] }) => {
  // Debug logging
  console.log('🧠 RiskPrediction component received:', predictions.length, 'predictions');
  if (predictions.length > 0) {
    console.log('🧠 Sample predictions for display:', predictions.slice(0, 3).map(p => ({
      region: p.region,
      type: p.disaster_type,
      risk: p.risk_score,
      confidence: p.confidence
    })));
  }

  const getRiskColor = (score) => {
    if (score >= 60) return 'text-red-500 bg-red-500/10';
    if (score >= 40) return 'text-orange-500 bg-orange-500/10';
    if (score >= 25) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-green-500 bg-green-500/10';
  };

  const getRiskLevel = (score) => {
    if (score >= 60) return 'Critical';
    if (score >= 40) return 'High';
    if (score >= 25) return 'Medium';
    return 'Low';
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 rounded-lg p-6"
    >
             <div className="flex items-center space-x-3 mb-6">
         <Brain className="w-6 h-6 text-purple-500" />
         <h3 className="text-xl font-semibold text-white">AI Risk Predictions</h3>
       </div>
       
       <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
         <p className="text-sm text-blue-300">
           🌍 European Disaster Risk Analysis - Real-time AI predictions for European regions
         </p>
         <p className="text-xs text-blue-400 mt-1">
           Showing {predictions.filter(p => ['EU', 'UK', 'DE', 'FR', 'IT', 'ES', 'NL', 'AT', 'CH', 'PL', 'GR', 'PT', 'BE', 'SE', 'NO', 'DK', 'FI'].includes(p.region)).length} European predictions
         </p>
       </div>
      
             <div className="space-y-4">
         {predictions.length === 0 ? (
           <div className="text-center py-8">
             <p className="text-slate-400">No risk predictions available</p>
           </div>
         ) : (
           predictions
             .filter(p => ['EU', 'UK', 'DE', 'FR', 'IT', 'ES', 'NL', 'AT', 'CH', 'PL', 'GR', 'PT', 'BE', 'SE', 'NO', 'DK', 'FI'].includes(p.region))
             .slice(0, 5)
             .map((prediction, index) => (
            <motion.div
              key={`${prediction.region}_${prediction.disaster_type}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-slate-700 rounded-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getTypeIcon(prediction.disaster_type)}</div>
                  <div>
                    <h4 className="text-white font-medium capitalize">
                      {prediction.disaster_type}
                    </h4>
                                         <p className="text-slate-400 text-sm">
                       {prediction.region} 
                       <span className="ml-2 px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded">
                         EU
                       </span>
                     </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(prediction.risk_score)}`}>
                    {getRiskLevel(prediction.risk_score)}
                  </div>
                  <p className="text-white font-bold text-lg">
                    {Math.round(prediction.risk_score)}%
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Confidence: {Math.round(prediction.confidence * 100)}%</span>
                <span>Updated: {new Date(prediction.predicted_at).toLocaleTimeString()}</span>
              </div>
              
              {/* Confidence bar */}
              <div className="mt-2 bg-slate-600 rounded-full h-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
                />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default RiskPrediction;
