const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
// const { protect, authorize } = require('../middleware/auth'); // If needed, enable protection

// Admin routes (would normally be protected by admin middleware)
router.get('/', formController.getAllForms);
router.post('/', formController.upsertForm);
router.put('/', formController.upsertForm); // Since upsert handles both
router.delete('/:id', formController.deleteForm);

// Client/Public route to fetch by service name
router.get('/service/:serviceName', formController.getFormByServiceName);

module.exports = router;
