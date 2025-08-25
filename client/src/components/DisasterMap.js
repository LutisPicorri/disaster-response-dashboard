import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';

// Custom marker icons
const createCustomIcon = (type, severity) => {
  const size = severity === 'critical' ? 20 : severity === 'high' ? 16 : 12;
  const colors = {
    earthquake: '#dc2626',
    wildfire: '#ea580c',
    flood: '#2563eb',
    weather: '#7c3aed',
    volcano: '#dc2626'
  };

  return L.divIcon({
    className: 'disaster-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${colors[type] || '#6b7280'};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.6}px;
        color: white;
        font-weight: bold;
      ">
        ${type.charAt(0).toUpperCase()}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

const DisasterMap = ({ disasters = [] }) => {
  const mapRef = useRef();
  const [map, setMap] = useState(null);
  const [selectedDisaster, setSelectedDisaster] = useState(null);

  // Debug logging
  console.log('🗺️ DisasterMap received disasters:', disasters.length, 'disasters');
  if (disasters.length > 0) {
    console.log('🗺️ Disaster details:', disasters.map(d => ({
      id: d.id,
      type: d.type,
      severity: d.severity,
      location: `${d.latitude}, ${d.longitude}`,
      description: d.description
    })));
  } else {
    console.log('🗺️ No disasters to display on map');
  }

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !map) {
      const mapInstance = mapRef.current;
      setMap(mapInstance);
    }
  }, [map]);

  // Fit bounds when disasters change
  useEffect(() => {
    if (map && disasters.length > 0) {
      const bounds = L.latLngBounds(
        disasters.map(d => [d.latitude, d.longitude])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, disasters]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getSeverityRadius = (severity) => {
    switch (severity) {
      case 'critical': return 50000;
      case 'high': return 30000;
      case 'medium': return 15000;
      case 'low': return 5000;
      default: return 10000;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getDisasterIcon = (type) => {
    const icons = {
      earthquake: '🌋',
      wildfire: '🔥',
      flood: '🌊',
      weather: '⛈️',
      volcano: '🌋'
    };
    return icons[type] || '⚠️';
  };

  return (
    <div className="relative h-full w-full" style={{ minHeight: '400px' }}>
      <MapContainer
        ref={mapRef}
        center={[50.0, 10.0]} // Center of Europe
        zoom={4}
        className="h-full w-full rounded-lg"
        style={{ height: '100%', minHeight: '400px' }}
        zoomControl={true}
        attributionControl={true}
      >
        {/* OpenStreetMap tile layer - completely free, no account required */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Render disaster markers */}
        {disasters.map((disaster) => (
          <React.Fragment key={disaster.id}>
            {/* Circle for affected area */}
            <Circle
              center={[disaster.latitude, disaster.longitude]}
              radius={getSeverityRadius(disaster.severity)}
              pathOptions={{
                color: getSeverityColor(disaster.severity),
                fillColor: getSeverityColor(disaster.severity),
                fillOpacity: 0.1,
                weight: 2
              }}
            />
            
            {/* Marker */}
            <Marker
              position={[disaster.latitude, disaster.longitude]}
              icon={createCustomIcon(disaster.type, disaster.severity)}
              eventHandlers={{
                click: () => setSelectedDisaster(disaster)
              }}
            >
              <Popup>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-2"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{getDisasterIcon(disaster.type)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {disaster.type}
                      </h3>
                      <span className={`text-sm px-2 py-1 rounded-full text-white ${
                        disaster.severity === 'critical' ? 'bg-red-500' :
                        disaster.severity === 'high' ? 'bg-orange-500' :
                        disaster.severity === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}>
                        {disaster.severity}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {disaster.description}
                  </p>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>📍 {disaster.latitude.toFixed(4)}, {disaster.longitude.toFixed(4)}</div>
                    <div>🕒 {formatTimestamp(disaster.timestamp)}</div>
                    <div>📡 Source: {disaster.source}</div>
                    {disaster.magnitude && (
                      <div>📊 Magnitude: {disaster.magnitude}</div>
                    )}
                    {disaster.depth && (
                      <div>⬇️ Depth: {disaster.depth}km</div>
                    )}
                  </div>
                </motion.div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        <div className="glass rounded-lg p-3">
          <h4 className="text-sm font-semibold text-white mb-2">Legend</h4>
          <div className="space-y-1">
            {['earthquake', 'wildfire', 'flood', 'weather'].map(type => (
              <div key={type} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: createCustomIcon(type, 'medium').options.html.match(/background: ([^;]+)/)[1] }}
                />
                <span className="text-xs text-white capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="glass rounded-lg p-3">
          <h4 className="text-sm font-semibold text-white mb-2">Severity</h4>
          <div className="space-y-1">
            {['critical', 'high', 'medium', 'low'].map(severity => (
              <div key={severity} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getSeverityColor(severity) }}
                />
                <span className="text-xs text-white capitalize">{severity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disaster Count */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <div className="glass rounded-lg px-3 py-2">
          <div className="text-sm text-white">
            <span className="font-semibold">{disasters.length}</span> active disasters
          </div>
        </div>
      </div>

      {/* No disasters message */}
      {disasters.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-[500]">
          <div className="glass rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">🌍</div>
            <h3 className="text-lg font-semibold text-white mb-2">No Active Disasters</h3>
            <p className="text-slate-300 text-sm">
              Real-time disaster data will appear here as it's detected
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisasterMap;
