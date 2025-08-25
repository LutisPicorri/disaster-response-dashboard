const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:3002",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: ['http://localhost:3002', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());
// Import routes and services
const disasterRoutes = require('./routes/disasters');
const userRoutes = require('./routes/users');
const alertRoutes = require('./routes/alerts');
const riskPredictionRoutes = require('./routes/risk-predictions');
const { initializeDatabase, getDatabase } = require('./database/init');
const { startDataCollection } = require('./services/dataCollector');
const { startRiskPrediction } = require('./services/riskPredictor');

// Routes
app.use('/api/disasters', disasterRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/risk-predictions', riskPredictionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.json(health);
});

// Detailed health check with database connectivity
app.get('/api/health/detailed', async (req, res) => {
  try {
    const db = getDatabase();
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      services: {
        dataCollection: 'running',
        riskPrediction: 'running'
      }
    };
    
    // Test database connection
    db.get('SELECT 1 as test', (err, row) => {
      if (err) {
        health.status = 'degraded';
        health.database = 'error';
        health.databaseError = err.message;
      }
      res.json(health);
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Serve React app for all other routes (only in production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Handle user location updates
  socket.on('updateLocation', (data) => {
    socket.join(`region_${data.region}`);
    console.log(`User ${socket.id} joined region ${data.region}`);
  });
  
  // Handle alert subscriptions
  socket.on('subscribeAlerts', (data) => {
    socket.join(`alerts_${data.type}`);
    console.log(`User ${socket.id} subscribed to ${data.type} alerts`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to other modules
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Initialize application
async function initializeApp() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized');
    
    // Start data collection services
    startDataCollection(io);
    console.log('✅ Data collection started');
    
    // Start risk prediction service
    startRiskPrediction(io);
    console.log('✅ Risk prediction started');
    
    // Start server
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log(`🚀 Disaster Response Dashboard Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend: http://localhost:3002`);
      console.log(`🔌 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Start the application
initializeApp();
