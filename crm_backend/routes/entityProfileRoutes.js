const express = require('express');
const compressUploads = require('../middleware/compressUploads');
const router = express.Router();
const multer = require('multer');
const {
  getEntityProfile,
  updateEntityProfile,
  uploadEntityDocument,
} = require('../controllers/entityProfileController');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/entity-profile
router.get('/', getEntityProfile);

// PUT /api/entity-profile  (update text fields)
router.put('/', updateEntityProfile);

// PUT /api/entity-profile/document/:docKey  (upload/replace a document)
router.put('/document/:docKey', upload.single('file'), compressUploads, uploadEntityDocument);

module.exports = router;
