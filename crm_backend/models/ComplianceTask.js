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
  noticeDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  noticeReplyDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  shareholdersDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  shareholdersReplyDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  directorsDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  directorsReplyDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  notesDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  notesReplyDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  temporaryDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  temporaryReplyDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  normalDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  completedAt: { type: Date },
  filing_year: { type: String, default: '' },
  assigned_staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  warning_status: { type: String, enum: ['None', 'Due Soon', 'Warning', 'Critical', 'Due Tomorrow', 'Overdue'], default: 'None' }
}, { timestamps: true });

// Indexes for performance
ComplianceTaskSchema.index({ companyId: 1, dueDate: 1 });
ComplianceTaskSchema.index({ clientUid: 1, dueDate: 1 });
ComplianceTaskSchema.index({ companyId: 1, status: 1 });

module.exports = mongoose.model('ComplianceTask', ComplianceTaskSchema);
