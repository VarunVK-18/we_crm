const mongoose = require('mongoose');

const entityProfileSchema = new mongoose.Schema({
  // One profile per user (Firebase UID)
  uid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Common Text Fields
  entityName: { type: String, default: '' },        // Company/Business name
  pan: { type: String, default: '' },               // PAN number
  email: { type: String, default: '' },             // Business email
  phone: { type: String, default: '' },             // Business phone
  address: { type: String, default: '' },           // Registered address
  cin: { type: String, default: '' },               // CIN number
  gstin: { type: String, default: '' },             // GSTIN
  directorName: { type: String, default: '' },      // Director/Founder name
  directorEmail: { type: String, default: '' },     // Director email
  directorPhone: { type: String, default: '' },     // Director phone
  directorPan: { type: String, default: '' },       // Director PAN
  directorDin: { type: String, default: '' },       // Director DIN
  bankAccount: { type: String, default: '' },       // Bank account number
  bankIfsc: { type: String, default: '' },          // IFSC code
  bankName: { type: String, default: '' },          // Bank name

  // Common Document References (stores MongoDB Document _id strings)
  panCardDocId: { type: String, default: '' },          // PAN card document
  panCardDocName: { type: String, default: '' },
  aadhaarDocId: { type: String, default: '' },          // Aadhaar document
  aadhaarDocName: { type: String, default: '' },
  incorpCertDocId: { type: String, default: '' },       // Incorporation certificate
  incorpCertDocName: { type: String, default: '' },
  addressProofDocId: { type: String, default: '' },     // Address proof
  addressProofDocName: { type: String, default: '' },
  directorPanDocId: { type: String, default: '' },      // Director PAN card
  directorPanDocName: { type: String, default: '' },
  directorPhotoDocId: { type: String, default: '' },    // Director photo
  directorPhotoDocName: { type: String, default: '' },
  bankDocId: { type: String, default: '' },             // Bank statement/passbook
  bankDocName: { type: String, default: '' },
  gstDocId: { type: String, default: '' },              // GST certificate
  gstDocName: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('EntityProfile', entityProfileSchema);
