const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  company_code: {
    type: String,
    required: [true, 'Company code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  company_name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  gstin: {
    type: String,
    default: '',
    trim: true
  },
  phone: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  settings: {
    incorporation_fee: { type: Number, default: 5000 },
    default_filing_tax: { type: Number, default: 18 },
    allow_agent_registration: { type: Boolean, default: true },
    require_document_verification: { type: Boolean, default: true },
    enable_document_extraction: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);
