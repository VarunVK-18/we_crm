const mongoose = require('mongoose');

const DscOrderSchema = new mongoose.Schema({
  clientUid: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, default: 'Class 3 (Signature + Encryption)' },
  stage: { type: String, default: 'Pending Verification' },
  progress: { type: Number, default: 0.0 }, // 0.0 to 1.0
  isCompleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('DscOrder', DscOrderSchema);
