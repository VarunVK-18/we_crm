const express = require('express');
const router = express.Router();
const multer = require('multer');
const { checkUser, permit } = require('../middleware/rbac');
const {
  getAllForClient,
  upsertServiceDetails,
  deleteServiceDetails,
  ocrUploadTracking
} = require('../controllers/serviceDetailsController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET  /api/service-details/:clientId  — get all service records for a client
router.get('/:clientId', checkUser, getAllForClient);

// POST /api/service-details/:clientId  — create / update a service record
router.post('/:clientId', checkUser, upsertServiceDetails);

// DELETE /api/service-details/:clientId/:serviceType  — delete a service record
router.delete('/:clientId/:serviceType', checkUser, deleteServiceDetails);

// POST /api/service-details/:clientId/:serviceType/ocr-upload  — upload receipt → OCR
router.post(
  '/:clientId/:serviceType/ocr-upload',
  checkUser,
  upload.single('receipt'),
  ocrUploadTracking
);

module.exports = router;
