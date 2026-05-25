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
  expertPhone: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('ServiceOrder', ServiceOrderSchema);
