const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';
console.log('Mongoose is attempting to connect to:', mongoURI);

mongoose.connect(mongoURI)
  .then(() => {
    console.log('====================================');
    console.log('🚀 Connected successfully to MongoDB!');
    console.log('====================================');
  })
  .catch((err) => {
    console.error('====================================');
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('Make sure your MongoDB server is running or your URI is correct.');
    console.log('====================================');
  });

// Base Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to WE CRM Backend API!',
    status: 'Healthy',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Import and mount Authentication Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api', authRoutes);

// Start Express Server
app.listen(PORT, () => {
  console.log('====================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`👉 Access URL: http://localhost:${PORT}`);
  console.log('====================================');
});
