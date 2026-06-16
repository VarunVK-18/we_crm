const mongoose = require('mongoose');

const ChecklistItemSchema = new mongoose.Schema({
  label: {
    type: String
  },
  title: {
    type: String,
    maxlength: 30
  },
  description: {
    type: String,
    maxlength: 200,
    default: ''
  },
  isChecked: {
    type: Boolean,
    default: false
  },
  checkedAt: {
    type: Date,
    default: null
  },
  checkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

const ChecklistSchema = new mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  service_name: {
    type: String,
    required: true,
    trim: true
  },
  // Filing Staff or Account Manager assigned to this checklist
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // The Client Manager who created this checklist
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [ChecklistItemSchema],
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  stage: {
    type: String,
    enum: ['quotePending', 'quoteAccepted', 'workAssigned', 'documentRequested', 'workInProgress', 'completed'],
    default: 'quotePending'
  },
  requested_documents: [{
    name: { type: String, required: true },
    fileUrl: { type: String, default: null },
    isUploaded: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: null }
  }],
  final_documents: [{
    name: { type: String, required: true },
    document_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    expiry_date: { type: Date, required: false },
    uploadedAt: { type: Date, default: Date.now }
  }],
  notes: {
    type: String,
    default: ''
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  action_required: {
    type: Boolean,
    default: false
  },
  dealClosedAmount: {
    type: Number,
    default: 0
  },
  advanceAmountPaid: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Auto-update status based on item completion
ChecklistSchema.pre('save', function () {
  if (this.items && this.items.length > 0) {
    const total = this.items.length;
    const checked = this.items.filter(i => i.isChecked).length;
    if (checked === 0) {
      this.status = 'pending';
    } else if (checked === total) {
      this.status = 'completed';
    } else {
      this.status = 'in_progress';
    }
  }
});

module.exports = mongoose.model('Checklist', ChecklistSchema);
