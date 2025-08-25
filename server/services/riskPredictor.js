const cron = require('node-cron');
const { getDatabase } = require('../database/init');

class RiskPredictor {
  constructor(io) {
    this.io = io;
    this.db = getDatabase();
    this.riskModels = new Map();
    this.lastPrediction = new Date();
  }

  // Start risk prediction service
  startRiskPrediction() {
    console.log('🤖 Starting AI risk prediction service...');
    
    // Run risk predictions every hour
    cron.schedule('0 * * * *', () => {
      this.generateRiskPredictions();
    });
    
    // Initial risk prediction
    this.generateRiskPredictions();
  }

  // Generate risk predictions for all regions
  async generateRiskPredictions() {
    try {
      console.log('🧠 Generating AI risk predictions...');
      
      const regions = ['EU', 'UK', 'DE', 'FR', 'IT', 'ES', 'NL', 'AT', 'CH', 'PL', 'GR', 'PT', 'BE', 'SE', 'NO', 'DK', 'FI'];
      const disasterTypes = ['earthquake', 'wildfire', 'flood', 'weather'];
      
      const predictions = [];

      for (const region of regions) {
        for (const disasterType of disasterTypes) {
          try {
            const prediction = await this.predictRiskForRegion(region, disasterType);
            if (prediction) {
              predictions.push(prediction);
              await this.saveRiskPrediction(prediction);
            }
          } catch (predictionError) {
            console.error(`Error predicting risk for ${region} ${disasterType}:`, predictionError.message);
            // Continue with other predictions instead of failing completely
          }
        }
      }

      if (predictions.length > 0) {
        this.broadcastRiskPredictions(predictions);
        console.log(`✅ Generated ${predictions.length} risk predictions`);
      } else {
        console.log('⚠️ No risk predictions generated');
      }

    } catch (error) {
      console.error('❌ Error generating risk predictions:', error.message);
    }
  }

  // Predict risk for a specific region and disaster type
  async predictRiskForRegion(region, disasterType) {
    try {
      // Get historical data for the region and disaster type
      const historicalData = await this.getHistoricalData(region, disasterType);
      
             // If no historical data, generate baseline predictions based on region and disaster type
       if (historicalData.length < 1) {
         return this.generateBaselinePrediction(region, disasterType);
       }

      // Calculate risk factors
      const riskFactors = this.calculateRiskFactors(historicalData, region, disasterType);
      
      // Generate risk score using AI model
      const riskScore = this.calculateRiskScore(riskFactors);
      
      // Calculate confidence level
      const confidence = this.calculateConfidence(historicalData.length, riskFactors);
      
      return {
        region: region,
        disaster_type: disasterType,
        risk_score: riskScore,
        confidence: confidence,
        factors: JSON.stringify(riskFactors),
        predicted_at: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Error predicting risk for ${region} ${disasterType}:`, error.message);
      return null;
    }
  }

    // Get historical data for analysis
  async getHistoricalData(region, disasterType) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM historical_data 
        WHERE type = ? AND region = ? 
        ORDER BY timestamp DESC 
        LIMIT 100
      `;
      
      this.db.all(query, [disasterType, region], (err, rows) => {
        if (err) {
          console.error(`Database error getting historical data for ${region} ${disasterType}:`, err.message);
          resolve([]); // Return empty array instead of rejecting
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  // Calculate risk factors based on historical data
  calculateRiskFactors(historicalData, region, disasterType) {
    const factors = {
      frequency: 0,
      severity: 0,
      seasonal: 0,
      weather: 0,
      recent_activity: 0
    };

    if (historicalData.length === 0) return factors;

    // Calculate frequency factor
    const timeSpan = this.getTimeSpan(historicalData);
    factors.frequency = historicalData.length / Math.max(timeSpan, 1);

    // Calculate severity factor
    const severityCounts = { low: 0, medium: 0, high: 0, critical: 0 };
    historicalData.forEach(event => {
      severityCounts[event.severity] = (severityCounts[event.severity] || 0) + 1;
    });
    factors.severity = (
      severityCounts.critical * 4 + 
      severityCounts.high * 3 + 
      severityCounts.medium * 2 + 
      severityCounts.low * 1
    ) / historicalData.length;

    // Calculate seasonal factor
    const currentMonth = new Date().getMonth();
    const seasonalEvents = historicalData.filter(event => {
      const eventMonth = new Date(event.timestamp).getMonth();
      return Math.abs(eventMonth - currentMonth) <= 1;
    });
    factors.seasonal = seasonalEvents.length / historicalData.length;

    // Calculate recent activity factor
    const recentEvents = historicalData.filter(event => {
      const eventDate = new Date(event.timestamp);
      const daysDiff = (new Date() - eventDate) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    });
    factors.recent_activity = recentEvents.length / Math.max(historicalData.length, 1);

    // Calculate weather factor based on current conditions
    factors.weather = this.calculateWeatherFactor(region, disasterType);

    return factors;
  }

  // Calculate risk score using AI model
  calculateRiskScore(factors) {
    // Weighted risk calculation with more realistic weights
    const weights = {
      frequency: 0.20,
      severity: 0.25,
      seasonal: 0.25,
      weather: 0.20,
      recent_activity: 0.10
    };

    let riskScore = 0;
    let totalWeight = 0;

    for (const [factor, value] of Object.entries(factors)) {
      if (weights[factor]) {
        riskScore += value * weights[factor];
        totalWeight += weights[factor];
      }
    }

    // Normalize to 0-100 scale with more conservative scaling
    riskScore = (riskScore / totalWeight) * 80; // Max 80% instead of 100%
    
    // Apply more conservative sigmoid function
    riskScore = 80 / (1 + Math.exp(-(riskScore - 40) / 15));
    
    return Math.min(Math.max(riskScore, 0), 80);
  }

  // Calculate confidence level
  calculateConfidence(dataCount, factors) {
    // Base confidence on data quality and consistency
    let confidence = Math.min(dataCount / 50, 1) * 0.6; // Max 60% from data quantity
    
    // Add confidence based on factor consistency
    const factorValues = Object.values(factors);
    const factorVariance = this.calculateVariance(factorValues);
    confidence += (1 - factorVariance) * 0.4; // Max 40% from consistency
    
    return Math.min(Math.max(confidence, 0), 1);
  }

  // Calculate weather factor
  calculateWeatherFactor(region, disasterType) {
    // Simplified weather factor calculation
    const weatherFactors = {
      earthquake: 0.1, // Earthquakes less affected by weather
      wildfire: 0.8,   // Wildfires highly affected by weather
      flood: 0.9,      // Floods highly affected by weather
      weather: 1.0     // Weather events completely affected by weather
    };
    
    return weatherFactors[disasterType] || 0.5;
  }

  // Helper methods
  getTimeSpan(historicalData) {
    if (historicalData.length < 2) return 1;
    
    const oldest = new Date(historicalData[historicalData.length - 1].timestamp);
    const newest = new Date(historicalData[0].timestamp);
    
    return Math.max((newest - oldest) / (1000 * 60 * 60 * 24), 1); // Days
  }

  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return variance;
  }

  // Save risk prediction to database
  async saveRiskPrediction(prediction) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO risk_predictions 
        (region, disaster_type, risk_score, confidence, factors, predicted_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        prediction.region,
        prediction.disaster_type,
        prediction.risk_score,
        prediction.confidence,
        prediction.factors,
        prediction.predicted_at
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

  // Broadcast risk predictions to connected clients
  broadcastRiskPredictions(predictions) {
    if (this.io) {
      this.io.emit('riskUpdate', {
        type: 'risk_predictions',
        data: predictions,
        timestamp: new Date().toISOString()
      });

      // Send high-risk predictions as alerts
      const highRiskPredictions = predictions.filter(p => p.risk_score > 70);
      if (highRiskPredictions.length > 0) {
        this.io.emit('riskAlert', {
          type: 'high_risk_alert',
          predictions: highRiskPredictions,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  // Get latest risk predictions
  async getLatestRiskPredictions(region = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT * FROM risk_predictions 
        WHERE predicted_at >= datetime('now', '-1 hour')
        ORDER BY predicted_at DESC
      `;
      
      const params = [];
      if (region) {
        query += ' AND region = ?';
        params.push(region);
      }
      
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  // Generate baseline prediction when no historical data is available
  generateBaselinePrediction(region, disasterType) {
    // More realistic base risk scores by region and disaster type
    const baselineRisks = {
      'EU': { earthquake: 12, wildfire: 18, flood: 22, weather: 28 },
      'UK': { earthquake: 8, wildfire: 12, flood: 35, weather: 42 },
      'DE': { earthquake: 10, wildfire: 15, flood: 32, weather: 28 },
      'FR': { earthquake: 18, wildfire: 22, flood: 25, weather: 20 },
      'IT': { earthquake: 28, wildfire: 25, flood: 18, weather: 22 },
      'ES': { earthquake: 22, wildfire: 35, flood: 15, weather: 28 },
      'NL': { earthquake: 6, wildfire: 8, flood: 38, weather: 32 },
      'AT': { earthquake: 25, wildfire: 15, flood: 22, weather: 18 },
      'CH': { earthquake: 22, wildfire: 12, flood: 18, weather: 15 },
      'PL': { earthquake: 15, wildfire: 18, flood: 25, weather: 22 },
      'GR': { earthquake: 32, wildfire: 28, flood: 12, weather: 22 },
      'PT': { earthquake: 25, wildfire: 28, flood: 18, weather: 25 },
      'BE': { earthquake: 8, wildfire: 12, flood: 32, weather: 28 },
      'SE': { earthquake: 12, wildfire: 15, flood: 22, weather: 18 },
      'NO': { earthquake: 15, wildfire: 12, flood: 25, weather: 22 },
      'DK': { earthquake: 8, wildfire: 8, flood: 28, weather: 25 },
      'FI': { earthquake: 12, wildfire: 15, flood: 22, weather: 18 }
    };

    const baseRisk = baselineRisks[region]?.[disasterType] || 30;
    
    // Add seasonal variation (more realistic adjustments)
    const currentMonth = new Date().getMonth();
    let seasonalAdjustment = 0;
    
    if (disasterType === 'wildfire' && (currentMonth >= 5 && currentMonth <= 8)) {
      seasonalAdjustment = 8; // Higher wildfire risk in summer
    } else if (disasterType === 'flood' && (currentMonth >= 2 && currentMonth <= 5)) {
      seasonalAdjustment = 6; // Higher flood risk in spring
    } else if (disasterType === 'weather' && (currentMonth >= 11 || currentMonth <= 2)) {
      seasonalAdjustment = 7; // Higher weather risk in winter
    }

    const riskScore = Math.min(Math.max(baseRisk + seasonalAdjustment, 0), 100);
    
    return {
      region: region,
      disaster_type: disasterType,
      risk_score: riskScore,
      confidence: 0.3, // Lower confidence for baseline predictions
      factors: JSON.stringify({
        baseline_risk: baseRisk,
        seasonal_adjustment: seasonalAdjustment,
        prediction_type: 'baseline'
      }),
      predicted_at: new Date().toISOString()
    };
  }

  // Add historical data for training
  async addHistoricalData(data) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO historical_data 
        (type, latitude, longitude, severity, timestamp, weather_conditions, seasonal_factors)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        data.type,
        data.latitude,
        data.longitude,
        data.severity,
        data.timestamp,
        data.weather_conditions || null,
        data.seasonal_factors || null
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
}

// Export singleton instance
let riskPredictorInstance = null;

function startRiskPrediction(io) {
  if (!riskPredictorInstance) {
    riskPredictorInstance = new RiskPredictor(io);
    riskPredictorInstance.startRiskPrediction();
  }
  return riskPredictorInstance;
}

module.exports = {
  startRiskPrediction,
  RiskPredictor
};
