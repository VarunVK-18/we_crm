const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  checklist_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Checklist',
    default: null
  },
  plan_name: {
    type: String,
    required: true
  },
  plan_tier: {
    type: String,
    required: true
  },
  service_type: {
    type: String,
    required: true
  },
  service_fee: {
    type: Number,
    required: true
  },
  activation_date: {
    type: Date,
    default: Date.now
  },
  expiry_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Expired', 'Cancelled'],
    default: 'Active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', SubscriptionSchema);
