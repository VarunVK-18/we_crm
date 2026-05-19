const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/complianceController');

// GET /api/compliance/user/:userId
router.get('/user/:userId', complianceController.getUserComplianceReminders);

// POST /api/compliance
router.post('/', complianceController.createComplianceReminder);

// PUT /api/compliance/:id
router.put('/:id', complianceController.updateComplianceReminder);

module.exports = router;
