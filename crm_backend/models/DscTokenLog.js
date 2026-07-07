const mongoose = require('mongoose');

const DscTokenLogSchema = new mongoose.Schema({
  serviceType: { type: String, required: true }, // e.g., 'Purchase', 'Individual DSC', 'Organizational DSC'
  applicantName: { type: String, default: '' },
  companyName: { type: String, default: '' },
  tokensConsumed: { type: Number, default: 0 },
  tokensAdded: { type: Number, default: 0 },
  remainingBalance: { type: Number, required: true },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  checklistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Checklist' }
}, { timestamps: true });

module.exports = mongoose.model('DscTokenLog', DscTokenLogSchema);
