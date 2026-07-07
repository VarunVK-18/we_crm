const mongoose = require('mongoose');

const DscTokenSchema = new mongoose.Schema({
  availableTokens: { type: Number, default: 0 },
  totalPurchased: { type: Number, default: 0 },
  totalConsumed: { type: Number, default: 0 },
  individualCount: { type: Number, default: 0 },
  organizationalCount: { type: Number, default: 0 },
  warningLimit: { type: Number, default: 10 }
}, { timestamps: true });

module.exports = mongoose.model('DscToken', DscTokenSchema);
