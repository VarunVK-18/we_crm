const express = require('express');
const router = express.Router();
const multer = require('multer');
const { checkUser, permit } = require('../middleware/rbac');
const { getTemplates, upsertTemplate, uploadSOP } = require('../controllers/templateController');

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per file
});

// All template routes are restricted to Admin
router.use(checkUser);
router.use(permit('admin'));

router.get('/checklists', getTemplates);
router.post('/checklists', upsertTemplate);
router.post('/checklists/:service_name/sop', upload.single('sop'), uploadSOP);

module.exports = router;
