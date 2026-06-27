const express = require('express');
const router = express.Router();
const { onboardFromDealVoice } = require('../controllers/intakeController');

// No auth middleware — key is validated inside the controller
router.post('/onboard', onboardFromDealVoice);

module.exports = router;
