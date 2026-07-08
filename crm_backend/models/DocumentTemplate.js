const mongoose = require('mongoose');

const DocumentTemplateSchema = new mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  // Rich HTML content with {{placeholder}} tokens
  html_content: {
    type: String,
    required: true,
    default: ''
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requires_customer_verification: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('DocumentTemplate', DocumentTemplateSchema);
