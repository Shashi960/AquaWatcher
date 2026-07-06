const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB } = require('./db');
const routes = require('./routes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5004;

// Standard Middlewares
app.use(cors());
// Test-report photos are stored with the complaint as data URLs in this demo.
// Allow normal phone screenshots without Express rejecting the request body.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static upload folders (if photo uploads are stored locally)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Bind routes
app.use('/api', routes);

// Simple Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Running',
    database: require('./db').isMongo() ? 'MongoDB' : 'Local JSON File',
    timestamp: new Date().toISOString() 
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Express Error Handler:", err.stack);
  res.status(500).json({ 
    message: 'Something went wrong inside the server.', 
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Initialize DB and Listen
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`AquaWatcher API Server listening on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error("Failed to start AquaWatcher API Server:", err);
    process.exit(1);
  }
};

startServer();
