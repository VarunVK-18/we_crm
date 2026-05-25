const express = require('express');
const router = express.Router();

const { getSettings, updateSettings } = require('../controllers/settingsController');
const { checkUser, permit, preventAuditorWrite } = require('../middleware/rbac');

router.get('/settings', checkUser, getSettings);
router.post('/settings', checkUser, preventAuditorWrite, permit('admin'), updateSettings);

module.exports = router;
