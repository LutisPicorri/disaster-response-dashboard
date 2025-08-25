const express = require('express');
const { getDatabase } = require('../database/init');
const router = express.Router();

// Get all risk predictions
router.get('/', async (req, res) => {
  try {
    const { region, disaster_type, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM risk_predictions WHERE 1=1';
    const params = [];
    
    if (region) {
      query += ' AND region = ?';
      params.push(region);
    }
    
    if (disaster_type) {
      query += ' AND disaster_type = ?';
      params.push(disaster_type);
    }
    
    query += ' ORDER BY predicted_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const db = getDatabase();
    
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json({
          predictions: rows || [],
          count: rows ? rows.length : 0,
          timestamp: new Date().toISOString()
        });
      }
    });
    
  } catch (error) {
    console.error('Error fetching risk predictions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get risk prediction by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDatabase();
    
    db.get('SELECT * FROM risk_predictions WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else if (!row) {
        res.status(404).json({ error: 'Risk prediction not found' });
      } else {
        res.json(row);
      }
    });
    
  } catch (error) {
    console.error('Error fetching risk prediction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get risk predictions by region
router.get('/region/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const { limit = 20 } = req.query;
    
    const db = getDatabase();
    
    const query = `
      SELECT * FROM risk_predictions 
      WHERE region = ?
      ORDER BY predicted_at DESC 
      LIMIT ?
    `;
    
    db.all(query, [region, parseInt(limit)], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json({
          region: region,
          predictions: rows || [],
          count: rows ? rows.length : 0,
          timestamp: new Date().toISOString()
        });
      }
    });
    
  } catch (error) {
    console.error('Error fetching regional risk predictions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get high-risk predictions
router.get('/high-risk', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const db = getDatabase();
    
    const query = `
      SELECT * FROM risk_predictions 
      WHERE risk_score >= 70
      ORDER BY risk_score DESC, predicted_at DESC 
      LIMIT ?
    `;
    
    db.all(query, [parseInt(limit)], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json({
          predictions: rows || [],
          count: rows ? rows.length : 0,
          timestamp: new Date().toISOString()
        });
      }
    });
    
  } catch (error) {
    console.error('Error fetching high-risk predictions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
