const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  performed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
