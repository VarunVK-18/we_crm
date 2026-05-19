const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  ticketId: { 
    type: String, 
    unique: true 
  },
  userId: { 
    type: String, 
    required: true 
  },
  userName: { 
    type: String, 
    required: true 
  },
  userEmail: { 
    type: String, 
    required: true 
  },
  subject: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Resolved'], 
    default: 'Pending' 
  },
  expert: { 
    type: String, 
    default: 'Unassigned' 
  }
}, { timestamps: true });

// Pre-save hook to generate sequential/random ticket IDs like TKT-4821
TicketSchema.pre('save', function() {
  if (!this.ticketId) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4 digit random number
    this.ticketId = `TKT-${randomDigits}`;
  }
});

module.exports = mongoose.model('Ticket', TicketSchema);
