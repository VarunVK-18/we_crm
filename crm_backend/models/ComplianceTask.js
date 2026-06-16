const mongoose = require('mongoose');

const ComplianceTaskSchema = new mongoose.Schema({
  clientUid: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  checklistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Checklist' },
  entityName: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Upcoming', 'Due Soon', 'Critical', 'Overdue', 'Completed'], 
    default: 'Upcoming' 
  },
  proofDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  certificateDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  acknowledgementDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  completedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('ComplianceTask', ComplianceTaskSchema);
