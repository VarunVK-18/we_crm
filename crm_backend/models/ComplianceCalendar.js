const mongoose = require('mongoose');

const complianceCalendarSchema = new mongoose.Schema({
  year: {
    type: String, // e.g. "2026-2027"
    required: true,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  events: [{
    dueDate: String,
    title: String,
    description: String,
    category: String,
    formsOrSections: String,
    applicableTo: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('ComplianceCalendar', complianceCalendarSchema);
