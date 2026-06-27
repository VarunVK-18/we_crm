const express = require('express');
const router = express.Router();
const { activateSubscription, getMySubscriptions, renewSubscription } = require('../controllers/subscriptionController');
const { checkUser } = require('../middleware/rbac');

router.post('/activate/:checklistId', checkUser, activateSubscription);
router.post('/renew/:subscriptionId', checkUser, renewSubscription);
router.get('/my-subscriptions', checkUser, getMySubscriptions);

module.exports = router;
