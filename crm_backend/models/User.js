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
    trim: true
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
  in_compliance_radar: {
    type: Boolean,
    default: true
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
  pan_name: {
    type: String,
    default: ''
  },
  pan_father_name: {
    type: String,
    default: ''
  },
  pan_dob: {
    type: String,
    default: ''
  },
  tan: {
    type: String,
    default: ''
  },
  cin: {
    type: String,
    default: ''
  },
  incorporation_date: {
    type: Date,
    default: null
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
  profile_image: {
    type: String,
    default: ''
  },
  onboarding_documents: {
    type: [{
      name: String,
      fileUrl: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
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
  },
  client_entities: {
    type: [{
      entityName: String,
      entityType: String,
      cin: String,
      pan: String,
      tan: String,
      gstin: String,
      iso: String,
      msme: String,
      fssai: String,
      incorporationDate: Date,
      // Incorporation
      coi: String,
      dsc: String,
      // GST
      gstUsername: String,
      gstPassword: String,
      gstArn: String,
      // Income Tax
      itrUsername: String,
      itrPassword: String,
      // DPIIT
      dpiitRecognitionNumber: String,
      dpiitApplicationId: String,
      // Trademark
      trademarkApplicationNumber: String,
      trademarkStatus: String,
      trademarkCertificate: String,
      // Patent
      patentApplicationNumber: String,
      patentStatus: String,
      patentNumber: String,
      // Copyright
      copyrightRegistrationNumber: String,
      copyrightCertificate: String,
      // TDS
      tdsUsername: String,
      tdsPassword: String,
      // PF
      pfEstablishmentId: String,
      pfUsername: String,
      pfPassword: String,
      // FSSAI
      fssaiTrackingId: String,
      fssaiApplicationId: String,
      // MSME
      msmeCertificate: String
    }],
    default: []
  },
  directors: {
    type: [{
      fullName: String,
      role: String,
      email: String,
      phone: String,
      pan: String,
      aadhaar: String,
      dob: String,
      din: String,
      photo: String,
      signature: String
    }],
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
