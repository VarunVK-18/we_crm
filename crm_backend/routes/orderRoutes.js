const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { checkUser } = require('../middleware/rbac');
const multer = require('multer');

const upload = multer({
  dest: 'uploads/dpiit/',
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
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

// Define fields for MSME Certification form
const msmeUploadFields = [
  { name: 'companyPan', maxCount: 1 },
  { name: 'ownerAadhaar', maxCount: 1 },
  { name: 'ownerPassbook', maxCount: 1 }
];

// @route   POST /api/orders/:id/submit-msme-form
// @desc    Submit MSME form details and docs
// @access  Private (Client)
router.post(
  '/:id/submit-msme-form',
  checkUser,
  upload.fields(msmeUploadFields),
  orderController.submitMsmeForm
);

// Define fields for GST Registration form
const gstUploadFields = [
  { name: 'photo', maxCount: 1 },
  { name: 'ebBill', maxCount: 1 },
  { name: 'houseTaxReceipt', maxCount: 1 },
  { name: 'rentalAgreement', maxCount: 1 }
];

// @route   POST /api/orders/:id/submit-gst-form
// @desc    Submit GST form details and docs
// @access  Private (Client)
router.post(
  '/:id/submit-gst-form',
  checkUser,
  upload.fields(gstUploadFields),
  orderController.submitGstForm
);

// Define fields for ISO Registration form
const isoUploadFields = [
  { name: 'msmeCertificate', maxCount: 1 }
];

// @route   POST /api/orders/:id/submit-iso-form
// @desc    Submit ISO form details and docs
// @access  Private (Client)
router.post(
  '/:id/submit-iso-form',
  checkUser,
  upload.fields(isoUploadFields),
  orderController.submitIsoForm
);

// @route   POST /api/orders/:id/submit-lie-form
router.post(
  '/:id/submit-lie-form',
  checkUser,
  upload.fields(isoUploadFields),
  orderController.submitLieForm
);

// @route   POST /api/orders/:id/submit-gst-compliance-form
router.post(
  '/:id/submit-gst-compliance-form',
  checkUser,
  upload.fields([
    { name: 'bankStatement', maxCount: 1 }
  ]),
  orderController.submitGstComplianceForm
);

// @route   POST /api/orders/:id/submit-mca-form
router.post(
  '/:id/submit-mca-form',
  checkUser,
  upload.fields([
    { name: 'coi', maxCount: 1 },
    { name: 'pan', maxCount: 1 },
    { name: 'moa', maxCount: 1 },
    { name: 'aoa', maxCount: 1 },
    { name: 'bankStatement', maxCount: 1 },
    { name: 'salesInvoice', maxCount: 1 },
    { name: 'purchaseBills', maxCount: 1 }
  ]),
  orderController.submitMcaForm
);

// @route   POST /api/orders/:id/submit-bis-form
router.post(
  '/:id/submit-bis-form',
  checkUser,
  upload.fields(isoUploadFields),
  orderController.submitBisForm
);

// Define fields for FSSAI Registration form
const fssaiUploadFields = [
  { name: 'aadhaarCard', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'passportPhoto', maxCount: 1 },
  { name: 'businessAddressProof', maxCount: 1 }
];

// @route   POST /api/orders/:id/submit-fssai-form
// @desc    Submit FSSAI form details and docs
// @access  Private (Client)
router.post(
  '/:id/submit-fssai-form',
  checkUser,
  upload.fields(fssaiUploadFields),
  orderController.submitFssaiForm
);

// Define fields for DSC Registration form
const dscUploadFields = [
  { name: 'applicantPan', maxCount: 1 },
  { name: 'applicantAadhaar', maxCount: 1 },
  { name: 'applicantPhoto', maxCount: 1 },
  { name: 'certificateOfIncorporation', maxCount: 1 },
  { name: 'organizationPan', maxCount: 1 },
  { name: 'gstCertificate', maxCount: 1 },
  { name: 'msmeCertificate', maxCount: 1 },
  { name: 'otherDirectorPan', maxCount: 1 }
];

// @route   POST /api/orders/:id/submit-dsc-form
// @desc    Submit DSC form details and docs
// @access  Private (Client)
router.post(
  '/:id/submit-dsc-form',
  checkUser,
  upload.fields(dscUploadFields),
  orderController.submitDscForm
);

// Define fields for GST Compliance form
const gstComplianceUploadFields = [
  { name: 'bankStatement', maxCount: 1 }
];

// @route   POST /api/orders/:id/submit-gst-compliance-form
// @desc    Submit GST compliance details and docs
// @access  Private (Client)
router.post(
  '/:id/submit-gst-compliance-form',
  checkUser,
  upload.fields(gstComplianceUploadFields),
  orderController.submitGstComplianceForm
);

// Define fields for Proprietorship form
const proprietorshipUploadFields = [
  { name: 'panCard', maxCount: 1 },
  { name: 'aadhaarCard', maxCount: 1 },
  { name: 'passportPhoto', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
  { name: 'businessAddressProof', maxCount: 1 }
];

// @route   POST /api/orders/:id/submit-proprietorship-form
router.post(
  '/:id/submit-proprietorship-form',
  checkUser,
  upload.fields(proprietorshipUploadFields),
  orderController.submitProprietorshipForm
);

// Define fields for TDS form
const tdsUploadFields = [
  { name: 'panCard', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
  { name: 'businessAddressProof', maxCount: 1 },
  { name: 'incorpCert', maxCount: 1 }
];

// @route   POST /api/orders/:id/submit-tds-form
router.post(
  '/:id/submit-tds-form',
  checkUser,
  upload.fields(tdsUploadFields),
  orderController.submitTdsForm
);

// Define fields for PF form
const pfUploadFields = [
  { name: 'panCard', maxCount: 1 },
  { name: 'businessAddressProof', maxCount: 1 },
  { name: 'incorpCert', maxCount: 1 },
  { name: 'cancelledCheque', maxCount: 1 },
  { name: 'authSignatoryProof', maxCount: 1 }
];

// @route   POST /api/orders/:id/submit-pf-form
router.post(
  '/:id/submit-pf-form',
  checkUser,
  upload.fields(pfUploadFields),
  orderController.submitPfForm
);

// Define fields for Patent form
const patentUploadFields = [
  { name: 'identityProof', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
  { name: 'inventionDescriptionDoc', maxCount: 1 },
  { name: 'drawingsDiagrams', maxCount: 1 },
  { name: 'authLetter', maxCount: 1 }
];

// @route   POST /api/orders/:id/submit-patent-form
router.post(
  '/:id/submit-patent-form',
  checkUser,
  upload.fields(patentUploadFields),
  orderController.submitPatentForm
);

// Define fields for GST Cancellation form
const gstCancellationUploadFields = [
  { name: 'gstCert', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'supportDocs', maxCount: 1 }
];

// @route   POST /api/orders/:id/submit-gst-cancellation-form
router.post(
  '/:id/submit-gst-cancellation-form',
  checkUser,
  upload.fields(gstCancellationUploadFields),
  orderController.submitGstCancellationForm
);

// Define fields for GST Filing form
const gstFilingUploadFields = [
  { name: 'salesReport', maxCount: 1 },
  { name: 'purchaseReport', maxCount: 1 },
  { name: 'gstInvoices', maxCount: 1 }
];

// @route   POST /api/orders/:id/submit-gst-filing-form
router.post(
  '/:id/submit-gst-filing-form',
  checkUser,
  upload.fields(gstFilingUploadFields),
  orderController.submitGstFilingForm
);

// Define fields for IEC form
const iecUploadFields = [
  { name: 'panCard', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
  { name: 'cancelledCheque', maxCount: 1 },
  { name: 'incorpCert', maxCount: 1 }
];

// @route   POST /api/orders/:id/submit-iec-form
router.post(
  '/:id/submit-iec-form',
  checkUser,
  upload.fields(iecUploadFields),
  orderController.submitIecForm
);

module.exports = router;
