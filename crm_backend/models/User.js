const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Link every user to a company (multi-tenant scoping)
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null,
    index: true
  },
  custom_client_id: {
    type: String,
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
  credentialHash: {
    type: String,
    default: null
  },
  password_changed: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    default: 'customer',
    index: true
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  fcm_token: {
    type: String,
    default: null
  },
  in_compliance_radar: {
    type: Boolean,
    default: false
  },
  // Compliance case: 'case1' = first year with us, 'case2' = renewal (we did year 1+), 'case3' = from another firm
  compliance_case: {
    type: String,
    enum: ['case1', 'case2', 'case3'],
    default: null
  },
  // How many compliance years has this client been with US (0 = brand new, 1 = finished year 1, etc.)
  compliance_year_count: {
    type: Number,
    default: 0
  },
  // File URL of client-uploaded Share Capital Bank Statement (Case 1 only)
  share_capital_bank_statement: {
    type: String,
    default: null
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
  company_email: { type: String, default: '' },
  main_division_description: { type: String, default: '' },
  authorised_capital: { type: String, default: '' },
  paidup_capital: { type: String, default: '' },
  total_obligation_of_contribution: { type: String, default: '' },
  address_type: { type: String, default: '' },
  street_address_line_1: { type: String, default: '' },
  street_address_line_2: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  postal_code: { type: String, default: '' },
  main_division_no: { type: String, default: '' },
  company_type_expanded: { type: String, default: '' },
  class_of_company: { type: String, default: '' },
  company_category: { type: String, default: '' },
  company_subcategory: { type: String, default: '' },
  registration_number: { type: String, default: '' },
  company_origin: { type: String, default: '' },
  roc: { type: String, default: '' },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  onboard: {
    type: Boolean,
    default: false
  },
  director_count: {
    type: Number,
    default: 0
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
  mca_username: {
    type: String,
    default: ''
  },
  mca_password: {
    type: String,
    default: ''
  },
  annual_turnover: {
    type: String,
    default: ''
  },
  mca_profile_completed: {
    type: Boolean,
    default: false
  },
  coi_file: { type: String, default: '' },
  moa_file: { type: String, default: '' },
  aoa_file: { type: String, default: '' },
  bank_statement_file: { type: String, default: '' },
  sales_invoice_file: { type: String, default: '' },
  purchase_bills_file: { type: String, default: '' },
  profile_image: {
    type: String,
    default: ''
  },
  dynamicProfileData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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
  outsourced_services: [{
    serviceName: String,
    markedAt: { type: Date, default: Date.now }
  }],
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
      entityLogo: { type: String, default: '' },
      entityType: String,
      cin: String,
      registration_number: String,
      date_of_incorporation: Date,
      roc: String,
      company_origin: String,
      company_email: String,
      address_type: String,
      street_address_line_1: String,
      street_address_line_2: String,
      city: String,
      state: String,
      postal_code: String,
      authorised_capital: String,
      paidup_capital: String,
      obligation_of_contribution: String,
      pan: String,
      tan: String,
      gstin: String,
      iso: String,
      msme: String,
        lei: String,
        iec: String,
      fssai: String,
      incorporationDate: Date,
      // Incorporation
      coi: String,
        mcaUsername: String,
        mcaPassword: String,
      dsc: String,
        dscTokenPin: String,
        dscPassword: String,
      // GST
      gstUsername: String,
      gstPassword: String,
      gstArn: String,
      // Income Tax
      itrUsername: String,
      itrPassword: String,
      // DPIIT
      dpiitRecognitionNumber: String,
        dpiitUsername: String,
        dpiitPassword: String,
        dunsNumber: String,
        bisNumber: String,
        fssaiPassword: String,
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
      firstName: String,
        lastName: String,
        fullName: String,
        role: String,
        isAuthSignatory: { type: String, enum: ['Yes', 'No'], default: 'No' },
        email: String,
        phone: String,
      mobileNumber: String,
      pan: String,
      aadhaar: String,
      dob: String,
      din: String,
        mcaUsername: String,
        mcaPassword: String,
        itrUsername: String,
        itrPassword: String,
      photo: String,
      signature: String,
      permanentAddressLine1: String,
      permanentAddressLine2: String,
      permanentCity: String,
      permanentState: String,
      permanentPincode: String,
      presentAddressLine1: String,
      presentAddressLine2: String,
      presentCity: String,
      presentState: String,
      presentPincode: String
    }],
    default: []
  },
  bank_details: {
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    accountType: { type: String, default: '' },
    branchName: { type: String, default: '' }
  },
  entity_requests: [{
    company_name: String,
    company_type: String,
    director_count: Number,
    state_of_registration: String,
    status: {
      type: String,
      default: 'pending' // 'pending', 'approved', 'rejected'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
