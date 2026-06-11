const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/complianceController');
const { checkUser, permit } = require('../middleware/rbac');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// NEW ENDPOINTS FOR COMPLIANCE TASKS
router.get('/tasks/all', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), complianceController.getAllComplianceTasks);
router.get('/tasks/user/:userId', checkUser, complianceController.getUserComplianceTasks);
router.post('/tasks/:id/complete', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager', 'customer'), upload.any(), complianceController.completeComplianceTask);

// GET /api/compliance/user/:userId
router.get('/user/:userId', complianceController.getUserComplianceReminders);

// GET /api/compliance/company/:companyId
router.get('/company/:companyId', checkUser, complianceController.getCompanyComplianceReminders);

// POST /api/compliance
router.post('/', complianceController.createComplianceReminder);

// PUT /api/compliance/:id
router.put('/:id', complianceController.updateComplianceReminder);

module.exports = router;
