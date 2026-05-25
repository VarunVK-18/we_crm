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
  }
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
  items: [TemplateItemSchema]
}, { timestamps: true });

// Ensure one template per service per company
ChecklistTemplateSchema.index({ company_id: 1, service_name: 1 }, { unique: true });

module.exports = mongoose.model('ChecklistTemplate', ChecklistTemplateSchema);
