const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  orderId: {
    type: String, // String because ServiceOrder ticket ID / order ID might be a string (or ObjectId)
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderRole: {
    type: String,
    enum: ['client', 'staff', 'admin'],
    default: 'client'
  },
  content: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
