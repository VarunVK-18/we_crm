const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';
console.log('Mongoose is attempting to connect to:', mongoURI);

mongoose.connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB.');
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err.message);
    console.log('Make sure your MongoDB server is running or your URI is correct.');
  });

// Base Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to WE CRM Backend API!',
    status: 'Healthy',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Import and mount Authentication, Ticket, Order, and DSC Routes
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const orderRoutes = require('./routes/orderRoutes');
const dscRoutes = require('./routes/dscRoutes');
const complianceRoutes = require('./routes/complianceRoutes');
const taskRoutes = require('./routes/taskRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const checklistRoutes = require('./routes/checklistRoutes');
const documentRoutes = require('./routes/documentRoutes');

app.use('/api', authRoutes);
app.use('/api', ticketRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dsc', dscRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api', taskRoutes);
app.use('/api', settingsRoutes);
app.use('/api', checklistRoutes);
app.use('/api', documentRoutes);

// Start Express Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access URL: http://localhost:${PORT}`);
});
