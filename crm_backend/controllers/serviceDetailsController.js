const ServiceDetails = require('../models/ServiceDetails');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─────────────────────────────────────────────────────────────
// OCR helper (reuses existing multi-key Gemini pattern)
// ─────────────────────────────────────────────────────────────
const extractTrackingNumber = async (base64Data, mimeType) => {
  const keys = [
    process.env.GEMINI_API_KEY1,
    process.env.GEMINI_API_KEY2,
    process.env.GEMINI_API_KEY3
  ].filter(Boolean);

  if (!keys.length) throw new Error('No Gemini API keys configured.');

  const prompt = `You are an expert OCR AI. Analyze this government acknowledgement receipt or certificate.
Extract the Application Tracking Number, Acknowledgement Number, Application Number, or Registration Number.
Return ONLY a valid JSON object with no markdown:
{
  "trackingNumber": "<string or null>"
}
Look for labels like: Application No, Acknowledgement No, Tracking ID, Ref No, Registration No, App No.
If not found, set trackingNumber to null.`;

  const imagePart = { inlineData: { data: base64Data, mimeType } };
  let lastError = null;

  for (const key of keys) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent([prompt, imagePart]);
      const text = await result.response.text();
      const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);
      return parsed.trackingNumber || null;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('All Gemini keys failed');
};

// ─────────────────────────────────────────────────────────────
// Helper: strip sensitive fields for customer role
// ─────────────────────────────────────────────────────────────
const TRACKING_ONLY_SERVICES = ['ISO', 'Trademark', 'BIS', 'RoHS', 'CE', 'Copyright', 'Patent'];

function sanitizeForClient(record) {
  if (!record) return null;
  const safe = {
    _id: record._id,
    serviceType: record.serviceType,
    clientId: record.clientId,
    trackingNumber: record.trackingNumber,
    updatedAt: record.updatedAt
  };
  return safe;
}

// ─────────────────────────────────────────────────────────────
// Helper: Build expiry status for director creds
// ─────────────────────────────────────────────────────────────
function getExpiryStatus(dateVal) {
  if (!dateVal) return 'none';
  const now = new Date();
  const diff = Math.ceil((new Date(dateVal) - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'expired';
  if (diff <= 30) return 'expiringSoon';
  return 'active';
}

function enrichRecord(rec) {
  if (!rec) return null;
  const obj = rec.toObject ? rec.toObject({ getters: true }) : rec;
  // Compute expiryStatus for top-level date
  obj.expiryStatus = getExpiryStatus(obj.expiryDate);
  // Compute for each director
  if (Array.isArray(obj.directorCredentials)) {
    obj.directorCredentials = obj.directorCredentials.map(d => ({
      ...d,
      expiryStatus: getExpiryStatus(d.expiryDate)
    }));
  }
  return obj;
}

// ─────────────────────────────────────────────────────────────
// GET /api/service-details/:clientId
// ─────────────────────────────────────────────────────────────
const getAllForClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const role = req.user?.role;

    const records = await ServiceDetails.find({ clientId });

    if (role === 'customer') {
      // Only return tracking numbers for eligible services
      const filtered = records
        .filter(r => TRACKING_ONLY_SERVICES.includes(r.serviceType))
        .map(r => sanitizeForClient(enrichRecord(r)));
      return res.json({ success: true, data: filtered });
    }

    // Admin, manager, filling_staff → full data
    return res.json({ success: true, data: records.map(enrichRecord) });
  } catch (err) {
    console.error('[ServiceDetails] getAllForClient error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/service-details/:clientId
// Create or update (upsert) a service record
// ─────────────────────────────────────────────────────────────
const upsertServiceDetails = async (req, res) => {
  try {
    const { clientId } = req.params;
    const role = req.user?.role;

    // Block customers from writing
    if (role === 'customer') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const {
      serviceType,
      username,
      password,
      gstTrn,
      expiryDate,
      tokenPin,
      trackingNumber,
      directorCredentials,
      tan,
      pfCode,
      leiNumber,
      iecNumber,
      issueDate,
      status,
      udyamNumber
    } = req.body;

    if (!serviceType) {
      return res.status(400).json({ success: false, message: 'serviceType is required.' });
    }

    const update = {
      $set: {
        lastUpdatedBy: req.user._id,
        ...(username !== undefined && { username }),
        ...(password !== undefined && { password }),
        ...(gstTrn !== undefined && { gstTrn }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate || null }),
        ...(tokenPin !== undefined && { tokenPin }),
        ...(trackingNumber !== undefined && { trackingNumber }),
        ...(directorCredentials !== undefined && { directorCredentials }),
          ...(tan !== undefined && { tan }),
          ...(pfCode !== undefined && { pfCode }),
          ...(leiNumber !== undefined && { leiNumber }),
          ...(iecNumber !== undefined && { iecNumber }),
          ...(issueDate !== undefined && { issueDate: issueDate || null }),
          ...(status !== undefined && { status }),
          ...(udyamNumber !== undefined && { udyamNumber })
      },
      $setOnInsert: { savedBy: req.user._id, clientId, serviceType }
    };

    const record = await ServiceDetails.findOneAndUpdate(
      { clientId, serviceType },
      update,
      { upsert: true, new: true, runValidators: true }
    );

    // --- SYNC TO CLIENT ENTITY ---
    const client = await User.findById(clientId);
    if (client && client.client_entities && client.client_entities.length > 0) {
      const entity = client.client_entities[0];
      let updated = false;

      
      
      if (serviceType === 'DSC') {
        if (tokenPin !== undefined) { entity.dscTokenPin = tokenPin; updated = true; }
        if (password !== undefined) { entity.dscPassword = password; updated = true; }
      }
      else if (serviceType === 'MCA') {
        if (username !== undefined) { entity.mcaUsername = username; updated = true; }
        if (password !== undefined) { entity.mcaPassword = password; updated = true; }
      }
      else if (serviceType === 'GST') {
        if (username !== undefined) { entity.gstUsername = username; updated = true; }
        if (password !== undefined) { entity.gstPassword = password; updated = true; }
        if (gstTrn !== undefined) { entity.gstArn = gstTrn; updated = true; }
      }
      
      else if (serviceType === 'DPIIT') {
        if (username !== undefined) { entity.dpiitUsername = username; updated = true; }
        if (password !== undefined) { entity.dpiitPassword = password; updated = true; }
      }
      else if (serviceType === 'DUNS') {
        if (trackingNumber !== undefined) { entity.dunsNumber = trackingNumber; updated = true; }
      }
      else if (serviceType === 'BIS') {
        if (trackingNumber !== undefined) { entity.bisNumber = trackingNumber; updated = true; }
      }
      else if (serviceType === 'ITR') {
        if (username !== undefined) { entity.itrUsername = username; updated = true; }
        if (password !== undefined) { entity.itrPassword = password; updated = true; }
      }
      else if (serviceType === 'TDS') {
        if (tan !== undefined) { entity.tan = tan; updated = true; }
        if (username !== undefined) { entity.tdsUsername = username; updated = true; }
        if (password !== undefined) { entity.tdsPassword = password; updated = true; }
      }
      else if (serviceType === 'PF') {
        if (pfCode !== undefined) { entity.pfEstablishmentId = pfCode; updated = true; }
        if (username !== undefined) { entity.pfUsername = username; updated = true; }
        if (password !== undefined) { entity.pfPassword = password; updated = true; }
      }
      else if (serviceType === 'MSME') {
        if (udyamNumber !== undefined) { entity.msme = udyamNumber; updated = true; }
      }
      else if (serviceType === 'LEI') {
        if (leiNumber !== undefined) { entity.lei = leiNumber; updated = true; }
      }
      else if (serviceType === 'IEC') {
        if (iecNumber !== undefined) { entity.iec = iecNumber; updated = true; }
      }
      else if (serviceType === 'FSSAI') {
        if (username !== undefined) { entity.fssaiTrackingId = username; updated = true; }
        if (password !== undefined) { entity.fssaiPassword = password; updated = true; }
      }
      else if (serviceType === 'Trademark') {
        if (trackingNumber !== undefined) { entity.trademarkApplicationNumber = trackingNumber; updated = true; }
      }
      else if (serviceType === 'Patent') {
        if (trackingNumber !== undefined) { entity.patentApplicationNumber = trackingNumber; updated = true; }
      }
      else if (serviceType === 'Copyright') {
        if (trackingNumber !== undefined) { entity.copyrightRegistrationNumber = trackingNumber; updated = true; }
      }

      if (updated) {
        client.markModified('client_entities');
      }

      // Sync Director Credentials
      if ((serviceType === 'MCA' || serviceType === 'ITR') && Array.isArray(directorCredentials)) {
        directorCredentials.forEach(dirCred => {
          const dirIndex = dirCred.index;
          if (client.directors && client.directors.length > dirIndex) {
            const dirProfile = client.directors[dirIndex];
            
      if (serviceType === 'DSC') {
        if (tokenPin !== undefined) { entity.dscTokenPin = tokenPin; updated = true; }
        if (password !== undefined) { entity.dscPassword = password; updated = true; }
      }
      else if (serviceType === 'MCA') {
              if (dirCred.username !== undefined) dirProfile.mcaUsername = dirCred.username;
              if (dirCred.password !== undefined) dirProfile.mcaPassword = dirCred.password;
            } 
      else if (serviceType === 'DPIIT') {
        if (username !== undefined) { entity.dpiitUsername = username; updated = true; }
        if (password !== undefined) { entity.dpiitPassword = password; updated = true; }
      }
      else if (serviceType === 'DUNS') {
        if (trackingNumber !== undefined) { entity.dunsNumber = trackingNumber; updated = true; }
      }
      else if (serviceType === 'BIS') {
        if (trackingNumber !== undefined) { entity.bisNumber = trackingNumber; updated = true; }
      }
      else if (serviceType === 'ITR') {
              if (dirCred.username !== undefined) dirProfile.itrUsername = dirCred.username;
              if (dirCred.password !== undefined) dirProfile.itrPassword = dirCred.password;
            }
            updated = true;
          }
        });
        if (updated) {
          client.markModified('directors');
        }
      }

      if (updated) {
        await client.save();
      }
    }
    // --- END SYNC ---

    return res.json({ success: true, data: enrichRecord(record), message: 'Saved successfully.' });
  } catch (err) {
    console.error('[ServiceDetails] upsertServiceDetails error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/service-details/:clientId/:serviceType
// ─────────────────────────────────────────────────────────────
const deleteServiceDetails = async (req, res) => {
  try {
    const { clientId, serviceType } = req.params;
    const role = req.user?.role;

    if (role === 'customer') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await ServiceDetails.findOneAndDelete({ clientId, serviceType });
    return res.json({ success: true, message: 'Deleted successfully.' });
  } catch (err) {
    console.error('[ServiceDetails] deleteServiceDetails error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/service-details/:clientId/:serviceType/ocr-upload
// Upload receipt → OCR → extract tracking number
// ─────────────────────────────────────────────────────────────
const ocrUploadTracking = async (req, res) => {
  try {
    const { clientId, serviceType } = req.params;
    const role = req.user?.role;

    if (role === 'customer') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const base64Data = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    let trackingNumber = null;
    try {
      trackingNumber = await extractTrackingNumber(base64Data, mimeType);
    } catch (ocrErr) {
      console.warn('[OCR] Tracking number extraction failed:', ocrErr.message);
    }

    if (!trackingNumber) {
      return res.status(422).json({
        success: false,
        message: 'Could not detect the Application Tracking Number from the uploaded document. Please enter it manually.'
      });
    }

    // Upsert the tracking number
    const record = await ServiceDetails.findOneAndUpdate(
      { clientId, serviceType },
      { $set: { trackingNumber, lastUpdatedBy: req.user._id }, $setOnInsert: { savedBy: req.user._id, clientId, serviceType } },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      trackingNumber,
      data: enrichRecord(record),
      message: `Tracking number extracted: ${trackingNumber}`
    });
  } catch (err) {
    console.error('[ServiceDetails] ocrUploadTracking error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllForClient,
  upsertServiceDetails,
  deleteServiceDetails,
  ocrUploadTracking
};
