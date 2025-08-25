const express = require('express');
const { getDatabase } = require('../database/init');
const router = express.Router();

// Get all alerts for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0, unread = false } = req.query;
    
    let query = `
      SELECT a.*, d.type, d.severity, d.description, d.latitude, d.longitude
      FROM alerts a
      JOIN disasters d ON a.disaster_id = d.id
      WHERE a.user_id = ?
    `;
    const params = [userId];
    
    if (unread === 'true') {
      query += ' AND a.is_read = 0';
    }
    
    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const db = getDatabase();
    
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json({
          alerts: rows || [],
          count: rows ? rows.length : 0,
          timestamp: new Date().toISOString()
        });
      }
    });
    
  } catch (error) {
    console.error('Error fetching user alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get alert by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDatabase();
    
    const query = `
      SELECT a.*, d.type, d.severity, d.description, d.latitude, d.longitude
      FROM alerts a
      JOIN disasters d ON a.disaster_id = d.id
      WHERE a.id = ?
    `;
    
    db.get(query, [id], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else if (!row) {
        res.status(404).json({ error: 'Alert not found' });
      } else {
        res.json(row);
      }
    });
    
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new alert
router.post('/', async (req, res) => {
  try {
    const { disaster_id, user_id, type, message } = req.body;
    
    // Validate required fields
    if (!disaster_id || !user_id || !type || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const db = getDatabase();
    
    // Check if disaster exists
    db.get('SELECT id FROM disasters WHERE id = ?', [disaster_id], (err, disaster) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else if (!disaster) {
        res.status(404).json({ error: 'Disaster not found' });
      } else {
        // Check if user exists
        db.get('SELECT id FROM users WHERE id = ?', [user_id], (err, user) => {
          if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
          } else if (!user) {
            res.status(404).json({ error: 'User not found' });
          } else {
            // Create alert
            const stmt = db.prepare(`
              INSERT INTO alerts (disaster_id, user_id, type, message)
              VALUES (?, ?, ?, ?)
            `);
            
            stmt.run([disaster_id, user_id, type, message], function(err) {
              if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Database error' });
              } else {
                res.status(201).json({
                  id: this.lastID,
                  disaster_id,
                  user_id,
                  type,
                  message,
                  message: 'Alert created successfully'
                });
              }
            });
            
            stmt.finalize();
          }
        });
      }
    });
    
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark alert as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDatabase();
    
    const stmt = db.prepare('UPDATE alerts SET is_read = 1 WHERE id = ?');
    
    stmt.run([id], function(err) {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else if (this.changes === 0) {
        res.status(404).json({ error: 'Alert not found' });
      } else {
        res.json({ message: 'Alert marked as read' });
      }
    });
    
    stmt.finalize();
    
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all user alerts as read
router.put('/user/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const db = getDatabase();
    
    const stmt = db.prepare('UPDATE alerts SET is_read = 1 WHERE user_id = ? AND is_read = 0');
    
    stmt.run([userId], function(err) {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json({ 
          message: 'All alerts marked as read',
          updated: this.changes
        });
      }
    });
    
    stmt.finalize();
    
  } catch (error) {
    console.error('Error marking all alerts as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete alert
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDatabase();
    
    const stmt = db.prepare('DELETE FROM alerts WHERE id = ?');
    
    stmt.run([id], function(err) {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else if (this.changes === 0) {
        res.status(404).json({ error: 'Alert not found' });
      } else {
        res.json({ message: 'Alert deleted successfully' });
      }
    });
    
    stmt.finalize();
    
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread alert count for user
router.get('/user/:userId/unread-count', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const db = getDatabase();
    
    db.get('SELECT COUNT(*) as count FROM alerts WHERE user_id = ? AND is_read = 0', [userId], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json({
          user_id: userId,
          unread_count: row.count,
          timestamp: new Date().toISOString()
        });
      }
    });
    
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get alerts by type for a user
router.get('/user/:userId/type/:type', async (req, res) => {
  try {
    const { userId, type } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const db = getDatabase();
    
    const query = `
      SELECT a.*, d.type, d.severity, d.description, d.latitude, d.longitude
      FROM alerts a
      JOIN disasters d ON a.disaster_id = d.id
      WHERE a.user_id = ? AND a.type = ?
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    db.all(query, [userId, type, parseInt(limit), parseInt(offset)], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json({
          user_id: userId,
          type: type,
          alerts: rows || [],
          count: rows ? rows.length : 0,
          timestamp: new Date().toISOString()
        });
      }
    });
    
  } catch (error) {
    console.error('Error fetching alerts by type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get alert statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const db = getDatabase();
    
    const stats = {};
    
    // Get total alert count
    db.get('SELECT COUNT(*) as count FROM alerts', (err, totalStats) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
      
      stats.total = totalStats.count;
      
      // Get unread count
      db.get('SELECT COUNT(*) as count FROM alerts WHERE is_read = 0', (err, unreadStats) => {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: 'Database error' });
          return;
        }
        
        stats.unread = unreadStats.count;
        
        // Get alerts by type
        db.all('SELECT type, COUNT(*) as count FROM alerts GROUP BY type', (err, typeStats) => {
          if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
          }
          
          stats.byType = typeStats;
          
          // Get recent alerts (last 24 hours)
          db.get('SELECT COUNT(*) as count FROM alerts WHERE created_at >= datetime("now", "-1 day")', (err, recentStats) => {
            if (err) {
              console.error('Database error:', err);
              res.status(500).json({ error: 'Database error' });
              return;
            }
            
            stats.recent24h = recentStats.count;
            stats.timestamp = new Date().toISOString();
            
            res.json(stats);
          });
        });
      });
    });
    
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk create alerts for multiple users
router.post('/bulk', async (req, res) => {
  try {
    const { disaster_id, user_ids, type, message } = req.body;
    
    if (!disaster_id || !user_ids || !Array.isArray(user_ids) || !type || !message) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    
    const db = getDatabase();
    
    // Validate disaster exists
    db.get('SELECT id FROM disasters WHERE id = ?', [disaster_id], (err, disaster) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else if (!disaster) {
        res.status(404).json({ error: 'Disaster not found' });
      } else {
        // Create alerts for all users
        const stmt = db.prepare(`
          INSERT INTO alerts (disaster_id, user_id, type, message)
          VALUES (?, ?, ?, ?)
        `);
        
        let created = 0;
        let errors = 0;
        
        user_ids.forEach((userId, index) => {
          stmt.run([disaster_id, userId, type, message], function(err) {
            if (err) {
              errors++;
            } else {
              created++;
            }
            
            // If this is the last user, send response
            if (index === user_ids.length - 1) {
              res.status(201).json({
                disaster_id,
                total_users: user_ids.length,
                alerts_created: created,
                errors: errors,
                message: `Created ${created} alerts successfully`
              });
            }
          });
        });
        
        stmt.finalize();
      }
    });
    
  } catch (error) {
    console.error('Error creating bulk alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
