const mongoose = require('mongoose');

const GlobalCounterSchema = new mongoose.Schema({
  entity: {
    type: String, // e.g. 'ticket'
    required: true,
    unique: true
  },
  seq: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('GlobalCounter', GlobalCounterSchema);
