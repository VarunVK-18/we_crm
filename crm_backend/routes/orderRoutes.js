const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { checkUser } = require('../middleware/rbac');
const multer = require('multer');

const upload = multer({
  dest: 'uploads/dpiit/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.get('/user/:userId', orderController.getUserOrders);
router.get('/company/:companyId', checkUser, orderController.getCompanyOrders);
router.post('/', orderController.createOrder);
router.put('/:id', orderController.updateOrder);

// Define fields for DPIIT form uploads
const dpiitUploadFields = [
  { name: 'incorpCert', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'pitchDeck', maxCount: 1 }
];

// Define fields for Incorp form uploads (up to 10 directors)
const incorpUploadFields = [
  { name: 'officeProof', maxCount: 1 }
];
for (let i = 1; i <= 10; i++) {
  incorpUploadFields.push({ name: `director_${i}_photo`, maxCount: 1 });
  incorpUploadFields.push({ name: `director_${i}_signature`, maxCount: 1 });
  incorpUploadFields.push({ name: `director_${i}_addressProof`, maxCount: 1 });
  incorpUploadFields.push({ name: `director_${i}_aadhaar`, maxCount: 1 });
  incorpUploadFields.push({ name: `director_${i}_pan`, maxCount: 1 });
}

// @route   POST /api/orders/:id/submit-dpiit-form
// @desc    Submit DPIIT form details and docs
// @access  Private (Client)
router.post(
  '/:id/submit-dpiit-form',
  checkUser,
  upload.fields(dpiitUploadFields),
  orderController.submitDpiitForm
);

// @route   POST /api/orders/:id/submit-incorp-form
// @desc    Submit Private Limited Incorp form details and docs
// @access  Private (Client)
router.post(
  '/:id/submit-incorp-form',
  checkUser,
  upload.fields(incorpUploadFields),
  orderController.submitIncorpForm
);

// Define fields for Trademark form uploads
const trademarkUploadFields = [
  { name: 'udyamCert', maxCount: 1 },
  { name: 'trademarkLogo', maxCount: 1 },
  { name: 'signature', maxCount: 1 }
];

// @route   POST /api/orders/:id/submit-trademark-form
// @desc    Submit Trademark form details and docs
// @access  Private (Client)
router.post(
  '/:id/submit-trademark-form',
  checkUser,
  upload.fields(trademarkUploadFields),
  orderController.submitTrademarkForm
);

// Define fields for LLP form uploads (2 partners + company docs)
const llpUploadFields = [
  { name: 'officeProof', maxCount: 1 },
  { name: 'paymentScreenshot', maxCount: 1 }
];
for (let i = 1; i <= 2; i++) {
  llpUploadFields.push({ name: `person_${i}_photo`, maxCount: 1 });
  llpUploadFields.push({ name: `person_${i}_signature`, maxCount: 1 });
  llpUploadFields.push({ name: `person_${i}_addressProof`, maxCount: 1 });
  llpUploadFields.push({ name: `person_${i}_aadhaar`, maxCount: 1 });
  llpUploadFields.push({ name: `person_${i}_pan`, maxCount: 1 });
}

// @route   POST /api/orders/:id/submit-llp-form
// @desc    Submit LLP Incorporation form details and docs
// @access  Private (Client)
router.post(
  '/:id/submit-llp-form',
  checkUser,
  upload.fields(llpUploadFields),
  orderController.submitLlpForm
);

module.exports = router;
