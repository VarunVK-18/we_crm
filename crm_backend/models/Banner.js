const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  targetUrl: {
    type: String,
    default: ''
  },
  theme: {
    type: String,
    default: 'light' // possible values: light, dark, purple, emerald, amber, rose
  },
  subtitle: {
    type: String,
    default: ''
  },
  buttonText: {
    type: String,
    default: 'Learn More'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
