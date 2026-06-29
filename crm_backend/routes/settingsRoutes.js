const express = require('express');
const router = express.Router();

const { getSettings, updateSettings, getBankSettings } = require('../controllers/settingsController');
const { checkUser, permit, preventAuditorWrite } = require('../middleware/rbac');

router.get('/settings', checkUser, getSettings);
router.get('/settings/bank', checkUser, getBankSettings);
router.post('/settings', checkUser, preventAuditorWrite, permit('admin'), updateSettings);

module.exports = router;
