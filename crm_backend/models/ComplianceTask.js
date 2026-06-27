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
  filing_year: { type: String, default: '' },
  assigned_staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  warning_status: { type: String, enum: ['None', 'Due Soon', 'Warning', 'Critical', 'Due Tomorrow', 'Overdue'], default: 'None' }
}, { timestamps: true });

module.exports = mongoose.model('ComplianceTask', ComplianceTaskSchema);
