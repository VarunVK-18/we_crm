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
  }
}, { timestamps: true });

module.exports = mongoose.model('ComplianceCalendar', complianceCalendarSchema);
