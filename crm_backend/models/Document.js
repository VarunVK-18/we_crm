const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  data: {
    type: Buffer,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approval_status: { type: String, enum: ['Uploaded', 'Under Review', 'Approved', 'Rejected'], default: 'Uploaded' },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  review_comments: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
