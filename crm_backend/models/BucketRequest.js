const mongoose = require('mongoose');

const bucketRequestSchema = new mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service_name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'claimed_by_manager', 'assigned', 'declined'],
    default: 'open',
    index: true
  },
  // The client_manager who claimed this bucket
  claimed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // The team explicitly assigned to this request by the manager
  team_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  claimed_at: {
    type: Date,
    default: null
  },
  // The filling_staff who self-assigned this job
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assigned_at: {
    type: Date,
    default: null
  },
  // The checklist created when manager claims it
  checklist_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Checklist',
    default: null
  },
  source: {
    type: String,
    enum: ['dealvoice', 'manual', 'we-crm', 'we-crm-new', 'we-crm-old', 'opportunity'],
    default: 'dealvoice'
  },
  // Extra data from DealVoice for display
  client_name: { type: String, default: '' },
  client_phone: { type: String, default: '' },
  client_email: { type: String, default: '' },
  client_company_name: { type: String, default: '' },
  dealvoice_client_id: { type: String, default: '' },
  // External compliance service flag — when true, no checklist is created;
  // client goes directly to Compliance Radar
  is_external_compliance: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.models.BucketRequest || mongoose.model('BucketRequest', bucketRequestSchema);
