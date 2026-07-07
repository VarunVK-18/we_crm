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
  getBill: {
    type: Boolean,
    default: false
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
  },
  expense: {
    amount: { type: Number, default: 0 },
    billUrl: { type: String, default: null },
    transactionId: { type: String, default: '' },
    paymentTimestamp: { type: Date, default: null },
    uploadedAt: { type: Date, default: null },
    reimbursementStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' }
  }
});

const ChecklistSchema = new mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  custom_service_id: {
    type: String,
    default: null
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
  // Team assigned to this checklist
  assigned_team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
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
  temporary_documents: [{
    name: { type: String, required: true },
    document_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    uploadedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['sent', 'replied'], default: 'sent' },
    reply_document_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
    reply_uploaded_at: { type: Date, default: null }
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
  need_temporary: {
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
  },
  turnover_category: {
    type: String,
    enum: ['Less than ₹20 Lakhs', 'Greater than ₹20 Lakhs and Less than ₹50 Lakhs', 'Greater than ₹50 Lakhs', ''],
    default: ''
  },
  recommended_plan: {
    type: String,
    default: ''
  },
  recommended_fee: {
    type: Number,
    default: 0
  },
  isGstApplicable: {
    type: Boolean,
    default: true
  },
  financialLogs: [{
    paymentType: { type: String, required: true },
    amount: { type: Number, required: true },
    transactionId: { type: String, default: '' },
    paymentTimestamp: { type: Date },
    addedAt: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false }
  }]
}, { timestamps: true });

// Auto-update status based on item completion and resolve need_temporary
ChecklistSchema.pre('save', async function () {
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

  if (this.isNew) {
    try {
      const ChecklistTemplate = mongoose.model('ChecklistTemplate');
      const template = await ChecklistTemplate.findOne({
        company_id: this.company_id,
        service_name: this.service_name
      });
      if (template) {
        this.need_temporary = template.need_temporary || false;
      }
    } catch (err) {
      console.error('Error in Checklist pre-save need_temporary:', err);
    }

    if (!this.custom_service_id && this.company_id) {
      try {
        const { getNextServiceId } = require('../utils/counterHelper');
        this.custom_service_id = await getNextServiceId(this.company_id);
      } catch (err) {
        console.error('Error generating custom_service_id in pre-save hook:', err);
      }
    }
  }
});

module.exports = mongoose.model('Checklist', ChecklistSchema);
