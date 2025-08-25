const axios = require('axios');
const cron = require('node-cron');
const { getDatabase } = require('../database/init');

class DataCollector {
  constructor(io) {
    this.io = io;
    this.db = getDatabase();
    this.cache = new Map();
    this.lastUpdate = new Date();
  }

  // Start data collection services
  startDataCollection() {
    console.log('🔄 Starting data collection services...');
    
    // Collect earthquake data every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.collectEarthquakeData();
    });
    
    // Collect NASA EONET data every 10 minutes
    cron.schedule('*/10 * * * *', () => {
      this.collectNASAEONETData();
    });
    
    // Collect weather alerts every 30 minutes (reduced frequency to prevent duplicates)
    cron.schedule('*/30 * * * *', () => {
      this.collectWeatherAlerts();
    });
    
    // Initial data collection
    this.collectEarthquakeData();
    this.collectNASAEONETData();
    this.collectWeatherAlerts();
  }

  // Collect earthquake data from USGS (Europe focus)
  async collectEarthquakeData() {
    try {
      console.log('🌍 Collecting earthquake data from USGS for Europe...');
      
      const response = await axios.get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson', {
        timeout: 10000
      });

      const earthquakes = response.data.features;
      const processedEarthquakes = [];

      for (const earthquake of earthquakes) {
        const { properties, geometry } = earthquake;
        const [lon, lat] = geometry.coordinates;
        
        // Filter for Europe region (roughly 35-70°N, -10°W to 40°E) and significant earthquakes
        if (lat >= 35 && lat <= 70 && lon >= -10 && lon <= 40 && properties.mag >= 2.5) {
          const severity = this.calculateEarthquakeSeverity(properties.mag);
          
          const disasterData = {
            id: `earthquake_${properties.id}`,
            type: 'earthquake',
            severity: severity,
            latitude: lat,
            longitude: lon,
            timestamp: new Date(properties.time).toISOString(),
            description: `${properties.mag} magnitude earthquake ${properties.place}`,
            source: 'USGS',
            magnitude: properties.mag,
            depth: geometry.coordinates[2]
          };

          await this.saveDisasterData(disasterData);
          processedEarthquakes.push(disasterData);
        }
      }

      if (processedEarthquakes.length > 0) {
        this.broadcastDisasterData(processedEarthquakes);
        console.log(`✅ Processed ${processedEarthquakes.length} European earthquakes`);
      } else {
        console.log('ℹ️ No significant European earthquakes found in the last 24 hours');
      }

    } catch (error) {
      console.error('❌ Error collecting earthquake data:', error.message);
    }
  }

  // Collect NASA EONET data for natural events (Europe focus)
  async collectNASAEONETData() {
    try {
      console.log('🛰️ Collecting NASA EONET data for Europe...');
      
      // Use the correct NASA EONET API endpoint
      const response = await axios.get('https://eonet.gsfc.nasa.gov/api/v3/events', {
        params: {
          limit: 30,
          days: 30,
          status: 'open'
        },
        timeout: 15000
      });

      const events = response.data.events || [];
      const processedEvents = [];

      for (const event of events) {
        try {
          // Check if event has categories and geometries
          if (!event.categories || !event.geometries || event.geometries.length === 0) {
            continue;
          }

          const disasterType = this.mapEONETType(event.categories[0].id);
          
          if (disasterType) {
            // Get the first geometry (most recent)
            const geometry = event.geometries[0];
            
            // Validate coordinates
            if (!geometry.coordinates || geometry.coordinates.length < 2) {
              continue;
            }
            
            const [lon, lat] = geometry.coordinates;
            
            // Filter for Europe region (roughly 35-70°N, -10°W to 40°E)
            if (lat >= 35 && lat <= 70 && lon >= -10 && lon <= 40) {
              const severity = this.calculateEONETSeverity(event);
              
              const disasterData = {
                id: `eonet_${event.id}`,
                type: disasterType,
                severity: severity,
                latitude: lat,
                longitude: lon,
                timestamp: geometry.date || new Date().toISOString(),
                description: `${event.title} - ${event.description || 'Natural event detected'}`,
                source: 'NASA_EONET',
                radius: this.calculateEventRadius(event)
              };

              await this.saveDisasterData(disasterData);
              processedEvents.push(disasterData);
            }
          }
        } catch (eventError) {
          console.error(`Error processing EONET event ${event.id}:`, eventError.message);
          continue;
        }
      }

      if (processedEvents.length > 0) {
        this.broadcastDisasterData(processedEvents);
        console.log(`✅ Processed ${processedEvents.length} European EONET events`);
      } else {
        console.log('ℹ️ No new European EONET events to process');
      }

    } catch (error) {
      console.error('❌ Error collecting NASA EONET data:', error.message);
      // Don't crash the application, just log the error
    }
  }

  // Collect weather alerts
  async collectWeatherAlerts() {
    try {
      console.log('🌤️ Collecting weather alerts...');
      
      // Using OpenWeatherMap API for weather alerts
      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (!apiKey) {
        console.log('⚠️ OpenWeatherMap API key not configured, skipping weather alerts');
        return;
      }

      // Collect alerts for major European cities
      const cities = [
        { name: 'London', lat: 51.5074, lon: -0.1278 },
        { name: 'Paris', lat: 48.8566, lon: 2.3522 },
        { name: 'Berlin', lat: 52.5200, lon: 13.4050 },
        { name: 'Rome', lat: 41.9028, lon: 12.4964 },
        { name: 'Madrid', lat: 40.4168, lon: -3.7038 },
        { name: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
        { name: 'Vienna', lat: 48.2082, lon: 16.3738 },
        { name: 'Prague', lat: 50.0755, lon: 14.4378 },
        { name: 'Budapest', lat: 47.4979, lon: 19.0402 },
        { name: 'Warsaw', lat: 52.2297, lon: 21.0122 }
      ];

      const processedAlerts = [];

      for (const city of cities) {
        try {
          // Check if we already have a recent weather alert for this city (within last 30 minutes)
          const existingAlert = await this.checkExistingWeatherAlert(city.name);
          if (existingAlert) {
            console.log(`⏭️ Skipping ${city.name} - recent weather alert already exists`);
            continue;
          }

          const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
            params: {
              lat: city.lat,
              lon: city.lon,
              appid: apiKey,
              units: 'metric'
            },
            timeout: 5000
          });

          const weather = response.data;
          
          // Check for severe weather conditions
          if (this.isSevereWeather(weather)) {
            const disasterData = {
              id: `weather_${city.name}_${Date.now()}`,
              type: 'weather',
              severity: this.calculateWeatherSeverity(weather),
              latitude: city.lat,
              longitude: city.lon,
              timestamp: new Date().toISOString(),
              description: `Severe weather alert for ${city.name}: ${weather.weather[0].description} (${weather.main.temp}°C, ${weather.wind.speed} m/s)`,
              source: 'OpenWeatherMap',
              radius: 50000 // 50km radius
            };

            await this.saveDisasterData(disasterData);
            processedAlerts.push(disasterData);
            console.log(`⚠️ Created weather alert for ${city.name}: ${weather.weather[0].description}`);
          }
        } catch (error) {
          console.error(`Error collecting weather for ${city.name}:`, error.message);
        }
      }

      if (processedAlerts.length > 0) {
        this.broadcastDisasterData(processedAlerts);
        console.log(`✅ Processed ${processedAlerts.length} weather alerts`);
        console.log('Weather alerts details:', processedAlerts.map(alert => ({
          city: alert.description.split(' ')[3], // Extract city name
          severity: alert.severity,
          temp: processedAlerts.find(a => a.description.includes(alert.description.split(' ')[3]))?.description
        })));
      } else {
        console.log('ℹ️ No severe weather conditions detected in European cities');
      }

      // Clean up old weather alerts (older than 2 hours)
      await this.cleanupOldWeatherAlerts();

    } catch (error) {
      console.error('❌ Error collecting weather alerts:', error.message);
    }
  }

  // Save disaster data to database
  async saveDisasterData(disasterData) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO disasters 
        (id, type, severity, latitude, longitude, timestamp, description, source, magnitude, depth, radius, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      stmt.run([
        disasterData.id,
        disasterData.type,
        disasterData.severity,
        disasterData.latitude,
        disasterData.longitude,
        disasterData.timestamp,
        disasterData.description,
        disasterData.source,
        disasterData.magnitude || null,
        disasterData.depth || null,
        disasterData.radius || null
      ], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });

      stmt.finalize();
    });
  }

  // Broadcast disaster data to connected clients
  broadcastDisasterData(disasters) {
    if (this.io) {
      this.io.emit('disasterUpdate', {
        type: 'new_disasters',
        data: disasters,
        timestamp: new Date().toISOString()
      });

      // Send to specific regions
      disasters.forEach(disaster => {
        const region = this.getRegionFromCoordinates(disaster.latitude, disaster.longitude);
        this.io.to(`region_${region}`).emit('disasterAlert', {
          type: 'regional_alert',
          disaster: disaster,
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  // Helper methods
  calculateEarthquakeSeverity(magnitude) {
    if (magnitude >= 8.0) return 'critical';
    if (magnitude >= 6.0) return 'high';
    if (magnitude >= 4.0) return 'medium';
    return 'low';
  }

  calculateEONETSeverity(event) {
    // Simple severity calculation based on event type and magnitude
    const category = event.categories[0].id;
    if (category.includes('severe-storms') || category.includes('volcanoes')) {
      return 'high';
    }
    return 'medium';
  }

  calculateWeatherSeverity(weather) {
    const temp = weather.main.temp;
    const windSpeed = weather.wind.speed;
    const weatherMain = weather.weather[0].main.toLowerCase();
    
    // More accurate severity calculation
    if (temp > 45 || temp < -25 || windSpeed > 35 || weatherMain.includes('thunderstorm')) {
      return 'critical';
    }
    if (temp > 40 || temp < -20 || windSpeed > 25) {
      return 'high';
    }
    return 'medium';
  }

  isSevereWeather(weather) {
    const temp = weather.main.temp;
    const windSpeed = weather.wind.speed;
    const weatherMain = weather.weather[0].main.toLowerCase();
    
    // Very restrictive conditions for severe weather - only truly dangerous conditions
    return temp > 45 || temp < -20 || windSpeed > 30 || 
           weatherMain.includes('thunderstorm') || 
           (weatherMain.includes('snow') && temp < -10) ||
           (weatherMain.includes('rain') && windSpeed > 25);
  }

  mapEONETType(categoryId) {
    const typeMap = {
      'severe-storms': 'weather',
      'volcanoes': 'volcano',
      'earthquakes': 'earthquake',
      'floods': 'flood',
      'wildfires': 'wildfire'
    };
    return typeMap[categoryId] || null;
  }

  calculateEventRadius(event) {
    // Estimate radius based on event type and magnitude
    const category = event.categories[0].id;
    if (category === 'volcanoes') return 100000; // 100km
    if (category === 'severe-storms') return 50000; // 50km
    return 25000; // 25km default
  }

  // Check if a weather alert already exists for a city within the last 30 minutes
  async checkExistingWeatherAlert(cityName) {
    return new Promise((resolve, reject) => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      this.db.get(`
        SELECT id FROM disasters 
        WHERE type = 'weather' 
        AND description LIKE ? 
        AND timestamp > ?
        LIMIT 1
      `, [`%${cityName}%`, thirtyMinutesAgo], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Clean up old weather alerts (older than 2 hours)
  async cleanupOldWeatherAlerts() {
    return new Promise((resolve, reject) => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      
      this.db.run(`
        DELETE FROM disasters 
        WHERE type = 'weather' 
        AND timestamp < ?
      `, [twoHoursAgo], function(err) {
        if (err) {
          console.error('Error cleaning up old weather alerts:', err);
          reject(err);
        } else {
          if (this.changes > 0) {
            console.log(`🧹 Cleaned up ${this.changes} old weather alerts`);
          }
          resolve();
        }
      });
    });
  }

  getRegionFromCoordinates(lat, lng) {
    // European region mapping based on coordinates
    if (lat >= 35 && lat <= 70 && lng >= -10 && lng <= 40) {
      // More specific European regions
      if (lat >= 49 && lat <= 60 && lng >= -8 && lng <= 2) return 'UK'; // United Kingdom
      if (lat >= 47 && lat <= 55 && lng >= 5 && lng <= 15) return 'DE'; // Germany
      if (lat >= 41 && lat <= 51 && lng >= -5 && lng <= 10) return 'FR'; // France
      if (lat >= 35 && lat <= 47 && lng >= 6 && lng <= 18) return 'IT'; // Italy
      if (lat >= 36 && lat <= 44 && lng >= -10 && lng <= 5) return 'ES'; // Spain
      if (lat >= 50 && lat <= 54 && lng >= 3 && lng <= 8) return 'NL'; // Netherlands
      if (lat >= 46 && lat <= 49 && lng >= 9 && lng <= 17) return 'AT'; // Austria
      if (lat >= 45 && lat <= 48 && lng >= 5 && lng <= 11) return 'CH'; // Switzerland
      if (lat >= 49 && lat <= 55 && lng >= 14 && lng <= 24) return 'PL'; // Poland
      return 'EU'; // General European Union
    }
    return 'GLOBAL';
  }
}

// Export singleton instance
let dataCollectorInstance = null;

function startDataCollection(io) {
  if (!dataCollectorInstance) {
    dataCollectorInstance = new DataCollector(io);
    dataCollectorInstance.startDataCollection();
  }
  return dataCollectorInstance;
}

module.exports = {
  startDataCollection,
  DataCollector
};
