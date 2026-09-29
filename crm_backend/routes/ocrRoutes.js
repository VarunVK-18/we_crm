const express = require('express');
const compressUploads = require('../middleware/compressUploads');
const router = express.Router();
const multer = require('multer');
const { checkUser } = require('../middleware/rbac');
const { extractPaymentDetails, extractApplicationDetails, extractIncorpDetails } = require('../controllers/ocrController');
const ocrService = require('../services/ocrValidationService');

// Set up memory storage for the uploaded image
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @route   POST /api/ocr/extract
// @desc    Extract text/details from an image using Gemini AI
// @access  Private
router.post('/extract', checkUser, upload.single('image'), compressUploads, extractPaymentDetails);

// @route   POST /api/ocr/extract-application
// @desc    Extract application ID/details from an acknowledgment receipt using Gemini AI
// @access  Private
router.post('/extract-application', checkUser, upload.single('document'), compressUploads, extractApplicationDetails);

// @route   POST /api/ocr/extract-incorp
// @desc    Extract Incorporation Date, CIN, PAN, TAN from a Certificate of Incorporation using Gemini AI
// @access  Private
router.post('/extract-incorp', checkUser, upload.single('image'), compressUploads, extractIncorpDetails);

// @route   POST /api/ocr/validate
// @desc    Validate uploaded image document for specific fields
// @access  Private
router.post('/validate', checkUser, upload.single('file'), compressUploads, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const fieldName = (req.body.fieldName || '').toLowerCase();
    const file = req.file;

    if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
      return res.json({ success: true, message: 'Non-image/non-pdf format bypassed for OCR' }); 
    }

    let isPan = fieldName.includes('pan');
    let isAadhaar = fieldName.includes('aadhaar');
    let isGst = fieldName.includes('gst');
    let isCoi = fieldName.includes('coi') || fieldName.includes('incorpcert');
    let isUdyam = fieldName.includes('udyam');
    let isTrademark = fieldName.includes('trademark');
    let isIso = fieldName.includes('iso');

    if (isPan || isAadhaar || isGst || isCoi || isUdyam || isTrademark || isIso) {
      const text = await ocrService.extractText(file.buffer, file.mimetype);
      let isValid = true;
      let docName = '';

      if (isPan) { isValid = ocrService.validatePAN(text); docName = 'PAN Card'; }
      else if (isAadhaar) { isValid = ocrService.validateAadhaar(text); docName = 'Aadhaar Card'; }
      else if (isGst) { isValid = ocrService.validateGST(text); docName = 'GST Certificate'; }
      else if (isCoi) { isValid = ocrService.validateCOI(text); docName = 'Incorporation Certificate'; }
      else if (isUdyam) { isValid = ocrService.validateUdyam(text); docName = 'Udyam Certificate'; }
      else if (isTrademark) { isValid = ocrService.validateTrademark(text); docName = 'Trademark Certificate'; }
      else if (isIso) { isValid = ocrService.validateISO(text); docName = 'ISO Certificate'; }

      if (!isValid) {
        return res.status(400).json({ success: false, message: `Please upload a correct valid ${docName}` });
      }
    }
    
    return res.json({ success: true, message: 'Validation passed' });
  } catch (error) {
    console.error('[OCR Validation Endpoint Error]', error);
    return res.status(400).json({ success: false, message: `Could not read the uploaded document. Please upload a clear and correct valid document.` });
  }
});

module.exports = router;
