const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use((req, res, next) => { console.log('INCOMING:', req.method, req.url); next(); });
app.use(express.json());
const fs = require('fs');

const getMimeTypeFromBufferSync = (buffer) => {
  if (!buffer || buffer.length < 4) return null;
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return 'application/pdf';
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'image/png';
  return null;
};

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath, stat) => {
    if (!path.extname(filePath)) {
      try {
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(4);
        fs.readSync(fd, buffer, 0, 4, 0);
        fs.closeSync(fd);
        const mime = getMimeTypeFromBufferSync(buffer);
        if (mime) {
          res.set('Content-Type', mime);
          const ext = mime === 'application/pdf' ? 'pdf' : (mime === 'image/jpeg' ? 'jpg' : 'png');
          res.set('Content-Disposition', `inline; filename="document.${ext}"`);
        } else {
          res.set('Content-Type', 'application/octet-stream');
          res.set('Content-Disposition', 'attachment; filename="document.bin"');
        }
      } catch (err) {
        // Fallback
      }
    }
  }
}));

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
const certificateRoutes = require('./routes/certificateRoutes');
const templateRoutes = require('./routes/templateRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const calendarRoutes = require('./routes/calendarRoutes');

app.use('/api', authRoutes);
app.use('/api', ticketRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dsc', dscRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api', taskRoutes);
app.use('/api', settingsRoutes);
app.use('/api', checklistRoutes);
app.use('/api', documentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calendar', calendarRoutes);

// Initialize Cron Jobs
require('./utils/cronJobs');

// Start Express Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access URL: http://localhost:${PORT}`);
});
