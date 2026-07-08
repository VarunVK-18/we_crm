const mongoose = require('mongoose');

const TemplateItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 30
  },
  description: {
    type: String,
    maxlength: 200,
    default: ''
  },
  getBill: {
    type: Boolean,
    default: false
  },
  need_temporary: {
    type: Boolean,
    default: false
  },
  request_document: {
    type: Boolean,
    default: false
  },
  has_custom_input: {
    type: Boolean,
    default: false
  },
  custom_input_label: {
    type: String,
    default: ''
  },
  linked_document_templates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentTemplate'
  }]
});

const ChecklistTemplateSchema = new mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  service_name: {
    type: String,
    required: true,
    trim: true
  },
  enable_document_extraction: {
    type: Boolean,
    default: false
  },
  need_temporary: {
    type: Boolean,
    default: false
  },
  sop_document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  items: [TemplateItemSchema],
  // Document templates linked to this service (reusable across services)
  document_templates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentTemplate'
  }]
}, { timestamps: true });

// Ensure one template per service per company
ChecklistTemplateSchema.index({ company_id: 1, service_name: 1 }, { unique: true });

module.exports = mongoose.model('ChecklistTemplate', ChecklistTemplateSchema);
