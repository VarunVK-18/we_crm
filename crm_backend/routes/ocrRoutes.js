const express = require('express');
const router = express.Router();
const multer = require('multer');
const { checkUser } = require('../middleware/rbac');
const { extractPaymentDetails, extractApplicationDetails, extractIncorpDetails } = require('../controllers/ocrController');

// Set up memory storage for the uploaded image
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @route   POST /api/ocr/extract
// @desc    Extract text/details from an image using Gemini AI
// @access  Private
router.post('/extract', checkUser, upload.single('image'), extractPaymentDetails);

// @route   POST /api/ocr/extract-application
// @desc    Extract application ID/details from an acknowledgment receipt using Gemini AI
// @access  Private
router.post('/extract-application', checkUser, upload.single('document'), extractApplicationDetails);

// @route   POST /api/ocr/extract-incorp
// @desc    Extract Incorporation Date, CIN, PAN, TAN from a Certificate of Incorporation using Gemini AI
// @access  Private
router.post('/extract-incorp', checkUser, upload.single('image'), extractIncorpDetails);

module.exports = router;
