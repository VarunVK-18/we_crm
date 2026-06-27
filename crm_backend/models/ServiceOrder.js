const mongoose = require('mongoose');

const ServiceStepSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date }
});

const ServiceOrderSchema = new mongoose.Schema({
  clientUid: { type: String, required: true },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  entityName: { type: String, default: 'Proprietorship' },
  serviceType: { type: String, required: true },
  companyName: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['notInitialized', 'active', 'complete'], 
    default: 'notInitialized' 
  },
  stage: { 
    type: String, 
    enum: ['reqReceived', 'workAssigned', 'workInProgress', 'testing', 'completed'], 
    default: 'reqReceived' 
  },
  steps: [ServiceStepSchema],
  assignedExpert: { type: String, default: 'To be assigned' },
  expertPhone: { type: String, default: '' },
  dealClosedAmount: { type: Number, default: 0 },
  advanceAmountPaid: { type: Number, default: 0 },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  documents: [{
    name: { type: String },
    filename: { type: String },
    fileUrl: { type: String }
  }],
  financialLogs: [{
    paymentType: { type: String, required: true },
    amount: { type: Number, required: true },
    transactionId: { type: String, default: '' },
    paymentTimestamp: { type: Date },
    addedAt: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false }
  }],
  turnover_category: { type: String, default: '' },
  recommended_plan: { type: String, default: '' },
  service_fee: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('ServiceOrder', ServiceOrderSchema);
