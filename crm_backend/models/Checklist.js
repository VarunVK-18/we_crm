const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  amount: { type: Number, default: 0 },
  billUrl: { type: String, default: null },
  transactionId: { type: String, default: '' },
  paymentTimestamp: { type: Date, default: null },
  uploadedAt: { type: Date, default: null },
  reimbursementStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paymentProofUrl: { type: String, default: null },
  paidAt: { type: Date, default: null },
  paidByName: { type: String, default: null }
});

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
  staff_description: {
    type: String,
    default: ''
  },
  getBill: {
    type: Boolean,
    default: false
  },
  isActionStep: {
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
  custom_input_value: {
    type: String,
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
  },
  linked_document_templates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentTemplate'
  }],
  expense: ExpenseSchema, // Kept for backwards compatibility
  expenses: [ExpenseSchema]
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
  dueDate: { type: Date },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  items: [ChecklistItemSchema],
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'under_review', 'reopen', 'completed', 'cancelled'],
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
    reply_uploaded_at: { type: Date, default: null },
    step_title: { type: String, default: null }
  }],
  notes: {
    type: String,
    default: ''
  },
  bank_details: {
    account_name: { type: String, default: '' },
    account_number: { type: String, default: '' },
    ifsc_code: { type: String, default: '' },
    bank_name: { type: String, default: '' },
    branch_name: { type: String, default: '' }
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
  isReviewed: {
    type: Boolean,
    default: false
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
    
    // Only auto-update if status isn't already set to a terminal/review state
    if (!this.isModified('status') && this.status !== 'completed' && this.status !== 'cancelled') {
      if (checked === 0) {
        this.status = 'pending';
      } else if (checked === total) {
        this.status = 'under_review';
      } else {
        this.status = 'in_progress';
      }
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

        if (!this.items || this.items.length === 0) {
          const formFillingItem = {
            title: 'Client Form Filling',
            label: 'Client Form Filling',
            description: 'Ensure the client has submitted all necessary initial forms and details.',
            staff_description: '',
            isChecked: false,
            isActionStep: true,
            need_temporary: false,
            has_custom_input: false,
            custom_input_label: '',
            linked_document_templates: []
          };

          const templateItems = (template.items || []).map(item => ({
            title: item.title,
            label: item.title,
            description: item.description || '',
            staff_description: item.staff_description || '',
            isChecked: false,
            isActionStep: item.isActionStep || false,
            getBill: item.getBill || false,
            need_temporary: item.need_temporary || false,
            request_document: item.request_document || false,
            has_custom_input: item.has_custom_input || false,
            custom_input_label: item.custom_input_label || '',
            linked_document_templates: item.linked_document_templates || []
          }));

          this.items = [formFillingItem, ...templateItems];
        } else {
          // If items were already partially initialized by a controller, sync their templates and config flags from the template
          let tmplItemIndex = 0;
          for (let clItem of this.items) {
            if (clItem.title === 'Client Form Filling') {
               clItem.isActionStep = true;
               continue;
            }
            
            const tmplItem = template.items && template.items[tmplItemIndex];
            if (tmplItem) {
              clItem.linked_document_templates = tmplItem.linked_document_templates || [];
              clItem.isActionStep = tmplItem.isActionStep || false;
              clItem.getBill = tmplItem.getBill || false;
              clItem.need_temporary = tmplItem.need_temporary || false;
              clItem.request_document = tmplItem.request_document || false;
              clItem.has_custom_input = tmplItem.has_custom_input || false;
              clItem.custom_input_label = tmplItem.custom_input_label || '';
              clItem.staff_description = tmplItem.staff_description || '';
            }
            tmplItemIndex++;
          }
        }
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
