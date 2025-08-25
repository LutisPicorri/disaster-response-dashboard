const express = require('express');
const { getDatabase } = require('../database/init');
const router = express.Router();

// Get all disasters with optional filtering
router.get('/', async (req, res) => {
  try {
    const { type, severity, region, limit = 100, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM disasters WHERE 1=1';
    const params = [];
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }
    
    if (region) {
      // Filter by region based on coordinates
      const regionBounds = getRegionBounds(region);
      if (regionBounds) {
        query += ' AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?';
        params.push(regionBounds.minLat, regionBounds.maxLat, regionBounds.minLng, regionBounds.maxLng);
      }
    }
    
    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const db = getDatabase();
    
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json({
          disasters: rows || [],
          count: rows ? rows.length : 0,
          timestamp: new Date().toISOString()
        });
      }
    });
    
  } catch (error) {
    console.error('Error fetching disasters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get disaster by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDatabase();
    
    db.get('SELECT * FROM disasters WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else if (!row) {
        res.status(404).json({ error: 'Disaster not found' });
      } else {
        res.json(row);
      }
    });
    
  } catch (error) {
    console.error('Error fetching disaster:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get disaster statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const db = getDatabase();
    
    const stats = {};
    
    // Get counts by type
    db.all('SELECT type, COUNT(*) as count FROM disasters GROUP BY type', (err, typeStats) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
      
      stats.byType = typeStats;
      
      // Get counts by severity
      db.all('SELECT severity, COUNT(*) as count FROM disasters GROUP BY severity', (err, severityStats) => {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: 'Database error' });
          return;
        }
        
        stats.bySeverity = severityStats;
        
        // Get recent activity (last 24 hours)
        db.get('SELECT COUNT(*) as count FROM disasters WHERE timestamp >= datetime("now", "-1 day")', (err, recentStats) => {
          if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
          }
          
          stats.recent24h = recentStats.count;
          
          // Get total count
          db.get('SELECT COUNT(*) as count FROM disasters', (err, totalStats) => {
            if (err) {
              console.error('Database error:', err);
              res.status(500).json({ error: 'Database error' });
              return;
            }
            
            stats.total = totalStats.count;
            stats.timestamp = new Date().toISOString();
            
            res.json(stats);
          });
        });
      });
    });
    
  } catch (error) {
    console.error('Error fetching disaster stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get disasters by region
router.get('/region/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const { limit = 50 } = req.query;
    
    const regionBounds = getRegionBounds(region);
    if (!regionBounds) {
      return res.status(400).json({ error: 'Invalid region' });
    }
    
    const db = getDatabase();
    
    const query = `
      SELECT * FROM disasters 
      WHERE latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?
      ORDER BY timestamp DESC 
      LIMIT ?
    `;
    
    db.all(query, [regionBounds.minLat, regionBounds.maxLat, regionBounds.minLng, regionBounds.maxLng, parseInt(limit)], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json({
          region: region,
          disasters: rows || [],
          count: rows ? rows.length : 0,
          bounds: regionBounds,
          timestamp: new Date().toISOString()
        });
      }
    });
    
  } catch (error) {
    console.error('Error fetching regional disasters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get disasters within radius of coordinates
router.get('/nearby/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const { radius = 100, limit = 50 } = req.query;
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);
    
    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
      return res.status(400).json({ error: 'Invalid coordinates or radius' });
    }
    
    const db = getDatabase();
    
    // Calculate bounding box for efficiency
    const latDelta = radiusKm / 111; // Approximate km per degree latitude
    const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
    
    const query = `
      SELECT *, 
        (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance
      FROM disasters 
      WHERE latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?
      HAVING distance <= ?
      ORDER BY distance ASC
      LIMIT ?
    `;
    
    db.all(query, [
      latitude, longitude, latitude,
      latitude - latDelta, latitude + latDelta,
      longitude - lngDelta, longitude + lngDelta,
      radiusKm, parseInt(limit)
    ], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json({
          center: { lat: latitude, lng: longitude },
          radius: radiusKm,
          disasters: rows || [],
          count: rows ? rows.length : 0,
          timestamp: new Date().toISOString()
        });
      }
    });
    
  } catch (error) {
    console.error('Error fetching nearby disasters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get disaster timeline
router.get('/timeline/:days', async (req, res) => {
  try {
    const { days } = req.params;
    const daysInt = parseInt(days);
    
    if (isNaN(daysInt) || daysInt < 1 || daysInt > 365) {
      return res.status(400).json({ error: 'Invalid days parameter (1-365)' });
    }
    
    const db = getDatabase();
    
    const query = `
      SELECT 
        DATE(timestamp) as date,
        type,
        severity,
        COUNT(*) as count
      FROM disasters 
      WHERE timestamp >= datetime('now', '-${daysInt} days')
      GROUP BY DATE(timestamp), type, severity
      ORDER BY date DESC, type, severity
    `;
    
    db.all(query, (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        // Group by date
        const timeline = {};
        rows.forEach(row => {
          if (!timeline[row.date]) {
            timeline[row.date] = {};
          }
          if (!timeline[row.date][row.type]) {
            timeline[row.date][row.type] = {};
          }
          timeline[row.date][row.type][row.severity] = row.count;
        });
        
        res.json({
          days: daysInt,
          timeline: timeline,
          totalEvents: rows.reduce((sum, row) => sum + row.count, 0),
          timestamp: new Date().toISOString()
        });
      }
    });
    
  } catch (error) {
    console.error('Error fetching disaster timeline:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to get region bounds (Europe-focused)
function getRegionBounds(region) {
  const bounds = {
    'EU': { minLat: 35, maxLat: 70, minLng: -10, maxLng: 40 },
    'UK': { minLat: 49, maxLat: 60, minLng: -8, maxLng: 2 },
    'DE': { minLat: 47, maxLat: 55, minLng: 5, maxLng: 15 },
    'FR': { minLat: 41, maxLat: 51, minLng: -5, maxLng: 10 },
    'IT': { minLat: 35, maxLat: 47, minLng: 6, maxLng: 18 },
    'ES': { minLat: 36, maxLat: 44, minLng: -10, maxLng: 5 },
    'NL': { minLat: 50, maxLat: 54, minLng: 3, maxLng: 8 },
    'AT': { minLat: 46, maxLat: 49, minLng: 9, maxLng: 17 },
    'CH': { minLat: 45, maxLat: 48, minLng: 5, maxLng: 11 },
    'PL': { minLat: 49, maxLat: 55, minLng: 14, maxLng: 24 },
    'GR': { minLat: 35, maxLat: 42, minLng: 20, maxLng: 28 },
    'PT': { minLat: 37, maxLat: 42, minLng: -10, maxLng: -6 },
    'BE': { minLat: 49, maxLat: 51, minLng: 2, maxLng: 6 },
    'SE': { minLat: 55, maxLat: 69, minLng: 11, maxLng: 24 },
    'NO': { minLat: 58, maxLat: 71, minLng: 4, maxLng: 31 },
    'DK': { minLat: 54, maxLat: 58, minLng: 8, maxLng: 15 },
    'FI': { minLat: 60, maxLat: 70, minLng: 20, maxLng: 32 }
  };
  
  return bounds[region.toUpperCase()] || null;
}

module.exports = router;
