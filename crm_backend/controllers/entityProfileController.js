const EntityProfile = require('../models/EntityProfile');
const Document = require('../models/Document');
const multer = require('multer');

// GET /api/entity-profile
// Returns the entity profile for the logged-in user
exports.getEntityProfile = async (req, res) => {
  try {
    const uid = req.headers['x-user-id'];
    if (!uid) return res.status(401).json({ message: 'Unauthorized' });
    
    const entityName = req.query.entityName;
    const query = { uid };
    if (entityName) {
      const escapedEntity = entityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.entityName = { $regex: new RegExp('^' + escapedEntity + '$', 'i') };
    }

    let profile = await EntityProfile.findOne(query).lean();
    
    // Even if the user hasn't submitted the profile form for this entity yet,
    // they might still have an active MCA subscription. Default to a virtual profile.
    if (!profile) {
      profile = { entityName: entityName === 'All Entities' ? '' : (entityName || '') };
    }

    const Subscription = require('../models/Subscription');
    const now = new Date();

    // Only find Active subscriptions that have not expired
    const activeSubs = await Subscription.find({
      client_id: uid,
      status: 'Active',
      expiry_date: { $gte: now }    // automatically respects financial-year expiry
    }).populate('checklist_id', 'entityName companyName details');

    // Helper to extract entity name mirroring mobile _parseEntityName
    const getSubEntity = (sub) => {
      const cl = sub.checklist_id || {};
      if (cl.details) {
        if (cl.details.entityName) return cl.details.entityName.trim().toLowerCase();
        if (cl.details.companyName) return cl.details.companyName.trim().toLowerCase();
        if (cl.details.proposed_company_name) return cl.details.proposed_company_name.trim().toLowerCase();
        if (cl.details.businessName) return cl.details.businessName.trim().toLowerCase();
      }
      if (cl.entityName) return cl.entityName.trim().toLowerCase();
      if (cl.companyName) return cl.companyName.trim().toLowerCase();
      if (sub.entityName) return sub.entityName.trim().toLowerCase();
      if (sub.companyName) return sub.companyName.trim().toLowerCase();
      return '';
    };

    // Check if any active subscription belongs to THIS specific entity
    const profileEntity = (profile.entityName || '').trim().toLowerCase();
    const hasMatchingPlan = activeSubs.some(sub => {
      const subEntity = getSubEntity(sub);
      // Match if the subscription is for this entity, or entity is unknown (legacy)
      return subEntity === profileEntity || subEntity === '';
    });

    // ── Migration guard: stored score must be profile-only (max 50) ──────────
    // Old code incorrectly baked the +50 plan bonus into the DB. Clamp here
    // so stale records don't double-count it.
    const storedProfileScore = Math.min(50, profile.complianceScore || 0);

    // Add the plan bonus at READ TIME — never persisted to DB
    if (hasMatchingPlan) {
      profile.complianceScore = storedProfileScore + 50;   // max 100
      profile.hasActivePlan = true;
      // Pass plan details to the client
      const matchedSub = activeSubs.find(sub => {
        const subEntity = getSubEntity(sub);
        return subEntity === profileEntity || subEntity === '';
      });
      if (matchedSub) {
        profile.activePlan = {
          planName: matchedSub.plan_name,
          expiryDate: matchedSub.expiry_date,
          status: matchedSub.status
        };
      }
    } else {
      profile.complianceScore = storedProfileScore;        // max 50
      profile.hasActivePlan = false;
      profile.activePlan = null;
    }

    return res.json({ profile });
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

    const entityName = req.body.entityName || req.query.entityName;
    if (!entityName) return res.status(400).json({ message: 'entityName is required' });

    // Only pick allowed fields; skip empty strings so we don't erase existing data
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined && req.body[field] !== '') {
        updates[field] = req.body[field];
      }
    }

    const profile = await EntityProfile.findOneAndUpdate(
      { uid, entityName },
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
    const entityName = req.body.entityName || req.query.entityName;
    if (!entityName) return res.status(400).json({ message: 'entityName is required for document upload' });

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
    const existing = await EntityProfile.findOne({ uid, entityName });
    if (existing && existing[docIdField]) {
      try {
        await Document.findByIdAndDelete(existing[docIdField]);
      } catch (_) { /* ignore if already deleted */ }
    }

    const profile = await EntityProfile.findOneAndUpdate(
      { uid, entityName },
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
