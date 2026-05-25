const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // Link every user to a company (multi-tenant scoping)
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  owner_name: {
    type: String,
    required: [true, 'Owner name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: false,
    default: '',
    set: function(val) {
      if (val === null || val === undefined) {
        return '';
      }
      return String(val);
    }
  },
  phone: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    default: 'customer'
  },
  company_code: {
    type: String,
    default: 'WE',
    trim: true,
    uppercase: true
  },
  company_name: {
    type: String,
    default: ''
  },
  business_type: {
    type: String,
    default: ''
  },
  pan: {
    type: String,
    default: ''
  },
  gstin: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  revenue: {
    type: Number,
    default: 0
  },
  gstin_file: {
    type: String,
    default: ''
  },
  pan_file: {
    type: String,
    default: ''
  },
  services: {
    type: [String],
    default: []
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  onboarding_status: {
    type: String,
    enum: ['Prospect', 'Ready for Approval', 'Approved', 'Rejected'],
    default: 'Prospect'
  },
  permissions: {
    type: [String],
    default: []
  }
}, { timestamps: true });

// Pre-save middleware to encrypt password before saving to database
UserSchema.pre('save', async function() {
  // If password is not set or empty, do not hash it
  if (!this.password || typeof this.password !== 'string' || this.password.trim() === '') {
    return;
  }

  // Only hash password if it has been modified or is new
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare candidate password with hashed password in database
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
