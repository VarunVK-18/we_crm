const express = require('express');
const router = express.Router();
const multer = require('multer');
const { checkUser } = require('../middleware/rbac');
const { extractPaymentDetails } = require('../controllers/ocrController');

// Set up memory storage for the uploaded image
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @route   POST /api/ocr/extract
// @desc    Extract text/details from an image using Gemini AI
// @access  Private
router.post('/extract', checkUser, upload.single('image'), extractPaymentDetails);

module.exports = router;
