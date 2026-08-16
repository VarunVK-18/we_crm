const EntityProfile = require('../models/EntityProfile');
const Document = require('../models/Document');
const multer = require('multer');

// GET /api/entity-profile
// Returns the entity profile for the logged-in user
exports.getEntityProfile = async (req, res) => {
  try {
    const uid = req.headers['x-user-id'];
    if (!uid) return res.status(401).json({ message: 'Unauthorized' });

    const profile = await EntityProfile.findOne({ uid });
    return res.json({ profile: profile || {} });
  } catch (err) {
    console.error('getEntityProfile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/entity-profile
// Upserts text fields for entity profile (JSON body)
exports.updateEntityProfile = async (req, res) => {
  try {
    const uid = req.headers['x-user-id'];
    if (!uid) return res.status(401).json({ message: 'Unauthorized' });

    const allowedFields = [
      'entityName', 'pan', 'email', 'phone', 'address',
      'cin', 'gstin', 'directorName', 'directorEmail',
      'directorPhone', 'directorPan', 'directorDin',
      'bankAccount', 'bankIfsc', 'bankName',
      // doc id/name fields
      'panCardDocId', 'panCardDocName',
      'aadhaarDocId', 'aadhaarDocName',
      'incorpCertDocId', 'incorpCertDocName',
      'addressProofDocId', 'addressProofDocName',
      'directorPanDocId', 'directorPanDocName',
      'directorPhotoDocId', 'directorPhotoDocName',
      'bankDocId', 'bankDocName',
      'gstDocId', 'gstDocName',
    ];

    // Only pick allowed fields; skip empty strings so we don't erase existing data
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined && req.body[field] !== '') {
        updates[field] = req.body[field];
      }
    }

    const profile = await EntityProfile.findOneAndUpdate(
      { uid },
      { $set: updates },
      { upsert: true, new: true }
    );

    return res.json({ message: 'Profile updated', profile });
  } catch (err) {
    console.error('updateEntityProfile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/entity-profile/document/:docKey
// Uploads a new document for a specific doc key, saves to DB, replaces old reference
exports.uploadEntityDocument = async (req, res) => {
  try {
    const uid = req.headers['x-user-id'];
    if (!uid) return res.status(401).json({ message: 'Unauthorized' });

    const { docKey } = req.params; // e.g. 'panCard', 'aadhaar', 'incorpCert', etc.

    const validDocKeys = [
      'panCard', 'aadhaar', 'incorpCert', 'addressProof',
      'directorPan', 'directorPhoto', 'bank', 'gst'
    ];
    if (!validDocKeys.includes(docKey)) {
      return res.status(400).json({ message: 'Invalid document key' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Save the file to Document collection
    const newDoc = new Document({
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer,
      uploadedBy: null,
    });
    await newDoc.save();

    const docIdField = `${docKey}DocId`;
    const docNameField = `${docKey}DocName`;

    // Optionally delete the old document from DB
    const existing = await EntityProfile.findOne({ uid });
    if (existing && existing[docIdField]) {
      try {
        await Document.findByIdAndDelete(existing[docIdField]);
      } catch (_) { /* ignore if already deleted */ }
    }

    const profile = await EntityProfile.findOneAndUpdate(
      { uid },
      { $set: { [docIdField]: newDoc._id.toString(), [docNameField]: req.file.originalname } },
      { upsert: true, new: true }
    );

    return res.json({
      message: 'Document uploaded',
      docId: newDoc._id.toString(),
      docName: req.file.originalname,
      profile
    });
  } catch (err) {
    console.error('uploadEntityDocument error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
