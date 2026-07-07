const express = require('express');
const router = express.Router();
const { checkUser, permit } = require('../middleware/rbac');
const dscTokenController = require('../controllers/dscTokenController');

// All token routes should be restricted to Super Admin or at least Admins.
// We'll use the existing `admin` middleware.
router.get('/status', checkUser, permit('superadmin', 'admin'), dscTokenController.getTokenStatus);
router.post('/purchase', checkUser, permit('superadmin', 'admin'), dscTokenController.purchaseTokens);
router.get('/logs', checkUser, permit('superadmin', 'admin'), dscTokenController.getTokenLogs);
router.put('/warning-limit', checkUser, permit('superadmin', 'admin'), dscTokenController.updateWarningLimit);

module.exports = router;
