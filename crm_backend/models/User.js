const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
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
    required: [true, 'Password is required']
  },
  phone: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'agent'],
    default: 'customer'
  },
  company_name: {
    type: String,
    default: ''
  },
  services: {
    type: [String],
    default: []
  }
}, { timestamps: true });

// Pre-save middleware to encrypt password before saving to database
UserSchema.pre('save', async function() {
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
