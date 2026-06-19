const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  entityName: {
    type: String,
    required: true,
    default: 'Proprietorship'
  },
  serviceName: {
    type: String,
    required: true
  },
  certificateNumber: {
    type: String,
    required: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  renewalRequired: {
    type: Boolean,
    default: true
  },
  renewalStatus: {
    type: String,
    default: 'Active'
  },
  latestRenewalChecklistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Checklist',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Certificate', CertificateSchema);
