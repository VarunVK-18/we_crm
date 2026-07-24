const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

// ────────────────────────────────────────────
// Encrypted String Field Helper
// ────────────────────────────────────────────
const encryptedString = (defaultVal = '') => ({
  type: String,
  default: defaultVal,
  get: (v) => (v ? decrypt(v) : ''),
  set: (v) => (v ? encrypt(v) : '')
});

// ────────────────────────────────────────────
// Director Credentials Sub-Schema
// ────────────────────────────────────────────
const DirectorCredSchema = new mongoose.Schema({
  index: { type: Number, default: 0 },
  label: { type: String, default: '' },       // e.g. "Director 1"
  username: encryptedString(),
  password: encryptedString(),
  expiryDate: { type: Date, default: null }
}, { _id: false });

// ────────────────────────────────────────────
// Main ServiceDetails Schema
// ────────────────────────────────────────────
const ServiceDetailsSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['MCA', 'DPIIT', 'GST', 'Trademark', 'BIS', 'Copyright', 'Patent', 'ITR', 'DSC', 'FSSAI', 'DUNS', 'TDS', 'PF', 'LEI', 'IEC', 'MSME']
  },
  // ── Company-level credentials (MCA, DPIIT, GST, ITR, DSC, FSSAI, TDS, PF, LEI, IEC, MSME) ──
  username: encryptedString(),
  password: encryptedString(),

  // ── LEI / IEC-specific ──
  leiNumber: { type: String, default: '' },
  iecNumber: { type: String, default: '' },
  udyamNumber: { type: String, default: '' },
  issueDate: { type: Date, default: null },
  status: { type: String, default: 'active' },

  // ── PF-specific ──
  pfCode: encryptedString(),

  // ── TDS-specific ──
  tan: encryptedString(),

  // ── GST-specific ──
  gstTrn: encryptedString(),          // Temporary Reference Number
  expiryDate: { type: Date, default: null },

  // ── DSC-specific ──
  tokenPin: encryptedString('wealthempires'),

  // ── Tracking Number (OCR-extracted) ──
  // Used for: ISO, Trademark, BIS, RoHS, CE, Copyright, Patent
  trackingNumber: { type: String, default: '' },

  // ── Director Credentials (MCA, ITR) ──
  directorCredentials: [DirectorCredSchema],

  // ── Receipt upload path for OCR services ──
  receiptFileUrl: { type: String, default: '' },

  // ── Metadata ──
  savedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Compound unique index: one record per client + service
ServiceDetailsSchema.index({ clientId: 1, serviceType: 1 }, { unique: true });

// ────────────────────────────────────────────
// Computed expiry status virtual
// ────────────────────────────────────────────
ServiceDetailsSchema.virtual('expiryStatus').get(function () {
  if (!this.expiryDate) return 'none';
  const now = new Date();
  const diff = Math.ceil((new Date(this.expiryDate) - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'expired';
  if (diff <= 30) return 'expiringSoon';
  return 'active';
});

// Computed expiry status for each director credential
DirectorCredSchema.virtual('expiryStatus').get(function () {
  if (!this.expiryDate) return 'none';
  const now = new Date();
  const diff = Math.ceil((new Date(this.expiryDate) - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'expired';
  if (diff <= 30) return 'expiringSoon';
  return 'active';
});

module.exports = mongoose.model('ServiceDetails', ServiceDetailsSchema);
