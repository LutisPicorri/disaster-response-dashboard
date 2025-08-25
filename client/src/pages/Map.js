import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DisasterMap from '../components/DisasterMap';
import { useDisasters } from '../hooks/useDisasters';

const Map = () => {
  const { disasters, loading } = useDisasters();
  const [selectedDisaster, setSelectedDisaster] = useState(null);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Disaster Map</h1>
          <p className="text-slate-400 mt-2">
            Real-time visualization of active disasters and events
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {disasters.length}
            </div>
            <div className="text-sm text-slate-400">Active Disasters</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800 rounded-lg p-6"
      >
        <div className="h-[600px] relative">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="spinner"></div>
            </div>
          ) : (
            <DisasterMap 
              disasters={disasters} 
              onDisasterSelect={setSelectedDisaster}
            />
          )}
        </div>
      </motion.div>

      {selectedDisaster && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 rounded-lg p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4">
            Disaster Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400">Type</p>
              <p className="text-white font-medium capitalize">
                {selectedDisaster.type}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Severity</p>
              <p className="text-white font-medium capitalize">
                {selectedDisaster.severity}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Location</p>
              <p className="text-white font-medium">
                {selectedDisaster.latitude.toFixed(4)}, {selectedDisaster.longitude.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Source</p>
              <p className="text-white font-medium">
                {selectedDisaster.source}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-slate-400">Description</p>
              <p className="text-white">
                {selectedDisaster.description}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Map;
