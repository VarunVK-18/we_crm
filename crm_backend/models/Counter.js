const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  entity: {
    type: String, // 'client', 'service'
    required: true
  },
  seq: {
    type: Number,
    default: 0
  }
});

CounterSchema.index({ company_id: 1, entity: 1 }, { unique: true });

module.exports = mongoose.model('Counter', CounterSchema);
