const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ Created data directory');
}

// Database file path
const dbPath = path.join(dataDir, 'disaster_dashboard.db');

// Create database connection with optimizations
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    console.error('Database path:', dbPath);
  } else {
    console.log('✅ Connected to SQLite database');
    console.log('Database path:', dbPath);
    
    // Enable WAL mode for better concurrency
    db.run('PRAGMA journal_mode = WAL');
    
    // Set cache size for better performance
    db.run('PRAGMA cache_size = 10000');
    
    // Enable memory-mapped I/O
    db.run('PRAGMA mmap_size = 268435456'); // 256MB
    
    // Set temp store to memory for better performance
    db.run('PRAGMA temp_store = MEMORY');
    
    // Set synchronous mode for better performance (NORMAL is a good balance)
    db.run('PRAGMA synchronous = NORMAL');
  }
});

// Initialize database tables
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    let completedOperations = 0;
    const totalOperations = 5; // 5 tables first
    
    const checkCompletion = () => {
      completedOperations++;
      if (completedOperations === totalOperations) {
        // After tables are created, create indexes
        createIndexes().then(() => {
          console.log('✅ Database tables and indexes created - ready for real-time data collection');
          resolve();
        }).catch(reject);
      }
    };
    
    const handleError = (err) => {
      console.error('❌ Database initialization error:', err);
      reject(err);
    };
    
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) handleError(err);
    });
    
    // Create disasters table
    db.run(`
      CREATE TABLE IF NOT EXISTS disasters (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        timestamp TEXT NOT NULL,
        description TEXT,
        source TEXT NOT NULL,
        magnitude REAL,
        depth REAL,
        radius REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) handleError(err);
      checkCompletion();
    });

    // Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        region TEXT,
        alert_preferences TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) handleError(err);
      checkCompletion();
    });

    // Create alerts table
    db.run(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        disaster_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (disaster_id) REFERENCES disasters (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `, (err) => {
      if (err) handleError(err);
      checkCompletion();
    });

    // Create historical_data table for AI analysis
    db.run(`
      CREATE TABLE IF NOT EXISTS historical_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        region TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        severity TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        weather_conditions TEXT,
        seasonal_factors TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) handleError(err);
      checkCompletion();
    });

    // Create risk_predictions table
    db.run(`
      CREATE TABLE IF NOT EXISTS risk_predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        region TEXT NOT NULL,
        disaster_type TEXT NOT NULL,
        risk_score REAL NOT NULL,
        confidence REAL NOT NULL,
        factors TEXT,
        predicted_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) handleError(err);
      checkCompletion();
    });
  });
}

// Create indexes after tables are created
async function createIndexes() {
  return new Promise((resolve, reject) => {
    let completedIndexes = 0;
    const totalIndexes = 7;
    
    const checkIndexCompletion = () => {
      completedIndexes++;
      if (completedIndexes === totalIndexes) {
        resolve();
      }
    };
    
    const handleIndexError = (err) => {
      console.error('❌ Index creation error:', err);
      reject(err);
    };
    
    // Create indexes for better performance
    db.run('CREATE INDEX IF NOT EXISTS idx_disasters_type ON disasters(type)', (err) => {
      if (err) handleIndexError(err);
      checkIndexCompletion();
    });
    db.run('CREATE INDEX IF NOT EXISTS idx_disasters_timestamp ON disasters(timestamp)', (err) => {
      if (err) handleIndexError(err);
      checkIndexCompletion();
    });
    db.run('CREATE INDEX IF NOT EXISTS idx_disasters_location ON disasters(latitude, longitude)', (err) => {
      if (err) handleIndexError(err);
      checkIndexCompletion();
    });
    db.run('CREATE INDEX IF NOT EXISTS idx_users_region ON users(region)', (err) => {
      if (err) handleIndexError(err);
      checkIndexCompletion();
    });
    db.run('CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id)', (err) => {
      if (err) handleIndexError(err);
      checkIndexCompletion();
    });
    db.run('CREATE INDEX IF NOT EXISTS idx_historical_timestamp ON historical_data(timestamp)', (err) => {
      if (err) handleIndexError(err);
      checkIndexCompletion();
    });
    db.run('CREATE INDEX IF NOT EXISTS idx_risk_predictions_region ON risk_predictions(region)', (err) => {
      if (err) handleIndexError(err);
      checkIndexCompletion();
    });
  });
}



// Get database instance
function getDatabase() {
  return db;
}

// Close database connection
function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Database connection closed');
        resolve();
      }
    });
  });
}

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase
};
