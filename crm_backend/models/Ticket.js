const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  ticketId: { 
    type: String, 
    unique: true,
    sparse: true   // allows null without unique conflict
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
  category: {
    type: String,
    default: 'General Support'
  },
  checklistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Checklist',
    default: null
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low'
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

/**
 * Generate a unique ticket ID using last 4 digits of timestamp + 3 random digits.
 * Format: INC-XXXXXXX  (e.g. INC-4271853)
 * This gives ~10M combinations vs the old 9K, making collisions extremely rare.
 */
function generateTicketId() {
  const tsPart = Date.now().toString().slice(-4);   // last 4 digits of ms timestamp
  const randPart = Math.floor(100 + Math.random() * 900); // 3-digit random
  return `INC-${tsPart}${randPart}`;
}

TicketSchema.pre('save', function() {
  if (!this.ticketId) {
    this.ticketId = generateTicketId();
  }
});

module.exports = mongoose.model('Ticket', TicketSchema);
