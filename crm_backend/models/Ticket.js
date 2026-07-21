const mongoose = require('mongoose');
const GlobalCounter = require('./GlobalCounter');

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
 * Generate a sequential ticket ID starting from 1001.
 * Format: INC1001, INC1002, etc.
 */
TicketSchema.pre('save', async function(next) {
  if (!this.ticketId) {
    try {
      const counter = await GlobalCounter.findOneAndUpdate(
        { entity: 'ticket' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      this.ticketId = `INC${1000 + counter.seq}`;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('Ticket', TicketSchema);
