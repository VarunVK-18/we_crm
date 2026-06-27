const mongoose = require('mongoose');

const RenewalHistorySchema = new mongoose.Schema({
  subscription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true,
    index: true
  },
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  old_expiry_date: {
    type: Date,
    required: true
  },
  new_expiry_date: {
    type: Date,
    required: true
  },
  renewed_on: {
    type: Date,
    default: Date.now
  },
  renewed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('RenewalHistory', RenewalHistorySchema);
