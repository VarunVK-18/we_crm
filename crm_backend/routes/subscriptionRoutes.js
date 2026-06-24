const express = require('express');
const router = express.Router();
const { activateSubscription, getMySubscriptions } = require('../controllers/subscriptionController');
const { checkUser } = require('../middleware/rbac');

router.post('/activate/:checklistId', checkUser, activateSubscription);
router.get('/my-subscriptions', checkUser, getMySubscriptions);

module.exports = router;
