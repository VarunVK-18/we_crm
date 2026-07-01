const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { checkUser } = require('../middleware/rbac');

// All notification routes require authentication
router.use(checkUser);

router.get('/', notificationController.getNotifications);
router.post('/fcm-token', notificationController.saveFCMToken);
router.put('/read', notificationController.markAsRead);
router.delete('/', notificationController.clearAll);
router.delete('/:id', notificationController.clearNotification);

module.exports = router;
