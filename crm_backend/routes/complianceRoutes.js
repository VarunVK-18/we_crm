const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/complianceController');
const { checkUser } = require('../middleware/rbac');

// GET /api/compliance/user/:userId
router.get('/user/:userId', complianceController.getUserComplianceReminders);

// GET /api/compliance/company/:companyId
router.get('/company/:companyId', checkUser, complianceController.getCompanyComplianceReminders);

// POST /api/compliance
router.post('/', complianceController.createComplianceReminder);

// PUT /api/compliance/:id
router.put('/:id', complianceController.updateComplianceReminder);

module.exports = router;
