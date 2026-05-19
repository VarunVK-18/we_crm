const mongoose = require('mongoose');

const ComplianceReminderSchema = new mongoose.Schema({
  clientUid: { type: String, required: true },
  serviceName: { type: String, required: true },
  entityName: { type: String, required: true },
  daysLeft: { type: Number, required: true },
  status: { type: String, enum: ['expiringSoon', 'urgent', 'expired'], default: 'expiringSoon' }
}, { timestamps: true });

module.exports = mongoose.model('ComplianceReminder', ComplianceReminderSchema);
