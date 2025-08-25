const express = require('express');
const { getDatabase } = require('../database/init');
const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const db = getDatabase();
    
    db.all('SELECT id, email, name, region, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?', 
      [parseInt(limit), parseInt(offset)], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json({
          users: rows || [],
          count: rows ? rows.length : 0,
          timestamp: new Date().toISOString()
        });
      }
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDatabase();
    
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else if (!row) {
        res.status(404).json({ error: 'User not found' });
      } else {
        // Parse alert preferences
        if (row.alert_preferences) {
          row.alert_preferences = JSON.parse(row.alert_preferences);
        }
        res.json(row);
      }
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const { email, name, latitude, longitude, region, alert_preferences } = req.body;
    
    // Validate required fields
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const db = getDatabase();
    
    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], (err, existingUser) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else if (existingUser) {
        res.status(409).json({ error: 'User with this email already exists' });
      } else {
        // Create new user
        const stmt = db.prepare(`
          INSERT INTO users (email, name, latitude, longitude, region, alert_preferences)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run([
          email,
          name,
          latitude || null,
          longitude || null,
          region || null,
          alert_preferences ? JSON.stringify(alert_preferences) : JSON.stringify({
            earthquake: true,
            wildfire: true,
            flood: true,
            weather: true
          })
        ], function(err) {
          if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
          } else {
            res.status(201).json({
              id: this.lastID,
              email,
              name,
              message: 'User created successfully'
            });
          }
        });
        
        stmt.finalize();
      }
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user location
router.put('/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, region } = req.body;
    
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    
    const db = getDatabase();
    
    const stmt = db.prepare(`
      UPDATE users 
      SET latitude = ?, longitude = ?, region = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run([lat, lng, region || null, id], function(err) {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else if (this.changes === 0) {
        res.status(404).json({ error: 'User not found' });
      } else {
        res.json({
          message: 'Location updated successfully',
          location: { latitude: lat, longitude: lng, region }
        });
      }
    });
    
    stmt.finalize();
    
  } catch (error) {
    console.error('Error updating user location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user alert preferences
router.put('/:id/alerts', async (req, res) => {
  try {
    const { id } = req.params;
    const { alert_preferences } = req.body;
    
    if (!alert_preferences || typeof alert_preferences !== 'object') {
      return res.status(400).json({ error: 'Alert preferences object is required' });
    }
    
    // Validate alert preferences
    const validTypes = ['earthquake', 'wildfire', 'flood', 'weather'];
    const preferences = {};
    
    for (const type of validTypes) {
      preferences[type] = alert_preferences[type] === true;
    }
    
    const db = getDatabase();
    
    const stmt = db.prepare(`
      UPDATE users 
      SET alert_preferences = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run([JSON.stringify(preferences), id], function(err) {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else if (this.changes === 0) {
        res.status(404).json({ error: 'User not found' });
      } else {
        res.json({
          message: 'Alert preferences updated successfully',
          alert_preferences: preferences
        });
      }
    });
    
    stmt.finalize();
    
  } catch (error) {
    console.error('Error updating alert preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get users by region
router.get('/region/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const { limit = 50 } = req.query;
    
    const db = getDatabase();
    
    db.all('SELECT id, email, name, latitude, longitude, created_at FROM users WHERE region = ? ORDER BY created_at DESC LIMIT ?', 
      [region, parseInt(limit)], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json({
          region: region,
          users: rows || [],
          count: rows ? rows.length : 0,
          timestamp: new Date().toISOString()
        });
      }
    });
    
  } catch (error) {
    console.error('Error fetching regional users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get users within radius of coordinates
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
      FROM users 
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
          users: rows || [],
          count: rows ? rows.length : 0,
          timestamp: new Date().toISOString()
        });
      }
    });
    
  } catch (error) {
    console.error('Error fetching nearby users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDatabase();
    
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    
    stmt.run([id], function(err) {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else if (this.changes === 0) {
        res.status(404).json({ error: 'User not found' });
      } else {
        res.json({ message: 'User deleted successfully' });
      }
    });
    
    stmt.finalize();
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const db = getDatabase();
    
    const stats = {};
    
    // Get total user count
    db.get('SELECT COUNT(*) as count FROM users', (err, totalStats) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
      
      stats.total = totalStats.count;
      
      // Get users by region
      db.all('SELECT region, COUNT(*) as count FROM users WHERE region IS NOT NULL GROUP BY region', (err, regionStats) => {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: 'Database error' });
          return;
        }
        
        stats.byRegion = regionStats;
        
        // Get recent registrations (last 7 days)
        db.get('SELECT COUNT(*) as count FROM users WHERE created_at >= datetime("now", "-7 days")', (err, recentStats) => {
          if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
          }
          
          stats.recent7d = recentStats.count;
          stats.timestamp = new Date().toISOString();
          
          res.json(stats);
        });
      });
    });
    
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
