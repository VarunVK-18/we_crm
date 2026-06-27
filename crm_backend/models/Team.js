const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  manager_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

teamSchema.index({ company_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.models.Team || mongoose.model('Team', teamSchema);
